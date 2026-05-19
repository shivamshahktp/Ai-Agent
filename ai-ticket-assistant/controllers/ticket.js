import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import analyzeTicket from "../utils/ai.js";

export const createTicket = async (req, res) => {
  console.log("📩 Backend: Received request to create ticket");
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Call the AI helper
    const aiData = await analyzeTicket({ title, description });

    const ticketData = {
      title,
      description,
      createdBy: req.user._id,
      // Use AI data if successful, otherwise use defaults
      helpfulNotes: aiData?.helpfulNotes || "No notes generated.",
      relatedSkills: aiData?.relatedSkills || [],
      priority: aiData?.priority || "medium",
      status: aiData?.isAutoResolvable ? "RESOLVED" : "TODO",
      resolvedByAI: aiData?.isAutoResolvable || false,
    };

    // --- SMART AUTO-ASSIGNMENT ENGINE ---
    // Only try to assign to a human if the AI didn't auto-resolve it
    if (!ticketData.resolvedByAI) {
      try {
      const staffMembers = await User.find({ role: { $in: ["admin", "moderator"] } });
      
      if (staffMembers.length > 0) {
        // Try to find staff with matching skills
        const qualifiedStaff = staffMembers.filter(staff => 
          staff.skills.some(skill => 
            ticketData.relatedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
          )
        );

        // If no one has the exact skills, fallback to all staff
        let candidates = qualifiedStaff.length > 0 ? qualifiedStaff : staffMembers;

        // Calculate workload for candidates
        const candidateIds = candidates.map(c => c._id);
        const activeTicketsCounts = await Ticket.aggregate([
          { $match: { assignedTo: { $in: candidateIds }, status: { $ne: "RESOLVED" } } },
          { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
        ]);

        const countsMap = {};
        activeTicketsCounts.forEach(t => countsMap[t._id.toString()] = t.count);

        // Sort candidates by workload (ascending)
        candidates.sort((a, b) => {
          const countA = countsMap[a._id.toString()] || 0;
          const countB = countsMap[b._id.toString()] || 0;
          return countA - countB;
        });

        // Assign to the least busy staff member
        ticketData.assignedTo = candidates[0]._id;
        console.log(`🤖 Smart Assign: Ticket assigned to ${candidates[0].email}`);
      }
    } catch (assignError) {
      console.error("Auto-assign error:", assignError.message);
      }
    }
    // ------------------------------------

    const newTicket = await Ticket.create(ticketData);
    console.log("💾 Backend: Ticket saved to Database with ID:", newTicket._id);

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error("❌ Backend: Error in createTicket:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin" && req.user.role !== "moderator") {
      query.createdBy = req.user._id;
    }
    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'email')
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('assignedTo', 'email');
    if (!ticket) return res.status(404).json({ message: "Not found" });
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    // Only allow admins/moderators to update status freely, or let any assigned user update it
    if (req.user.role === "user") {
      const ticket = await Ticket.findById(req.params.id);
      if (ticket.createdBy.toString() !== req.user._id && ticket.assignedTo?.toString() !== req.user._id) {
         return res.status(403).json({ message: "Forbidden" });
      }
    }
    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updatedTicket) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Not found" });
    
    // Only allow the creator or an admin/moderator to delete the ticket
    if (req.user.role === "user" && ticket.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: "Forbidden: You cannot delete this ticket" });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};