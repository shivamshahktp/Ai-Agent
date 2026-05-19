import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
     setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData("ticketId", ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    if (!ticketId) return;

    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (err) {
      console.error(err);
      fetchTickets(); // Revert on failure
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        fetchTickets(); // Refresh list
      } else {
        alert(data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-5xl mx-auto mt-6"
    >
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full md:w-1/3"
        >
          <div className="bg-base-100/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-base-300 sticky top-24">
            <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Submit Request
            </h2>
            <p className="text-xs text-base-content/60 mb-6">Our AI will automatically categorize and extract metadata.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label text-xs font-semibold uppercase text-base-content/70">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Cannot access production DB"
                  className="input input-bordered w-full bg-base-50 focus:border-primary transition-colors"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-semibold uppercase text-base-content/70">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detailed explanation of the issue..."
                  className="textarea textarea-bordered w-full h-32 bg-base-50 focus:border-primary transition-colors"
                  required
                ></textarea>
              </div>
              <button className="btn btn-primary w-full mt-2 rounded-xl" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : "Analyze & Submit"}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Right Column: Kanban Board */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full md:w-2/3 flex flex-col"
        >
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-xl font-semibold text-base-content/90">Kanban Board <span className="text-sm font-normal text-base-content/50 ml-2">({tickets.length})</span></h2>
            <p className="text-xs text-base-content/50">Drag and drop cards to update status</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
            {['TODO', 'IN PROGRESS', 'RESOLVED'].map(status => {
              const colTickets = tickets.filter(t => (t.status || 'TODO') === status);
              return (
                <div 
                  key={status} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className="bg-base-200/50 backdrop-blur rounded-2xl p-4 border border-base-300 flex flex-col gap-3 min-h-[300px]"
                >
                  <h3 className="font-bold text-sm tracking-widest text-base-content/60 flex justify-between items-center">
                    {status}
                    <span className="badge badge-sm badge-ghost">{colTickets.length}</span>
                  </h3>
                  
                  {colTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket._id)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-base-100/90 rounded-xl shadow-sm border border-base-200 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all p-4 group"
                    >
                      <Link to={`/tickets/${ticket._id}`} className="block">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors leading-tight">{ticket.title}</h4>
                        </div>
                        <p className="text-xs text-base-content/60 line-clamp-2 mb-3">{ticket.description}</p>
                        <div className="flex justify-between items-center text-xs border-t border-base-200 pt-2">
                           <div className="flex items-center gap-1">
                             <div className="avatar placeholder">
                               <div className="bg-neutral text-neutral-content rounded-full w-5">
                                 <span className="text-[8px]">{ticket.assignedTo ? ticket.assignedTo.email.charAt(0).toUpperCase() : '?'}</span>
                               </div>
                             </div>
                             <span className="text-[10px] text-base-content/50 truncate max-w-[60px]">{ticket.assignedTo ? ticket.assignedTo.email.split('@')[0] : 'Unassigned'}</span>
                           </div>
                           <div className="flex gap-1">
                             {ticket.resolvedByAI && <span className="badge badge-xs badge-success font-mono">⚡ AI RESOLVED</span>}
                             <span className={`badge badge-xs font-mono ${ticket.priority === 'high' ? 'badge-error' : ticket.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                               {ticket.priority || 'low'}
                             </span>
                           </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                  
                  {colTickets.length === 0 && (
                     <div className="flex-grow flex items-center justify-center text-base-content/30 text-sm border-2 border-dashed border-base-300 rounded-xl">
                       Drop Here
                     </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}