import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setTicket(data);
        } else {
          alert(data.message || "Failed to fetch ticket");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        navigate("/");
      } else {
        const data = await res.json();
        alert(data.message || data.error || "Failed to delete ticket");
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setShowDeleteModal(false);
    }
  };

  if (loading)
    return <div className="text-center mt-10">Loading ticket details...</div>;
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 mt-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => window.history.back()} className="btn btn-sm btn-ghost btn-circle">
          ←
        </button>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
          Ticket Workspace
          {ticket.resolvedByAI && (
            <span className="badge badge-success text-xs font-mono uppercase tracking-wider py-2">⚡ Auto-Resolved by AI</span>
          )}
        </h2>
        <div className="ml-auto flex items-center gap-3">
          <span className="badge badge-outline font-mono text-xs opacity-50 hidden sm:inline-flex">
            ID: {ticket._id}
          </span>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm btn-error btn-outline rounded-full px-4">
            Delete
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal modal-open bg-base-300/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-box"
          >
            <h3 className="font-bold text-lg text-error">Delete Ticket</h3>
            <p className="py-4 text-base-content/70">Are you sure you want to permanently delete this ticket? This action cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-error" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-base-100/80 backdrop-blur-md rounded-2xl shadow-xl border border-base-300 p-6">
            <h3 className="text-2xl font-semibold mb-4 leading-tight">{ticket.title}</h3>
            <div className="bg-base-200/60 p-4 rounded-xl text-base-content/80 whitespace-pre-wrap font-medium">
              {ticket.description}
            </div>
          </div>

          {ticket.helpfulNotes && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-base-100/90 backdrop-blur-md rounded-2xl shadow-xl border border-info/30 p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-info"></div>
              <h4 className="text-sm font-bold uppercase text-info mb-3 flex items-center gap-2">
                <span>🤖</span> AI Diagnostic Report
              </h4>
              <div className="prose prose-sm max-w-none text-base-content/80 prose-headings:text-base-content prose-a:text-info">
                <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-base-100/80 backdrop-blur-md rounded-2xl shadow-xl border border-base-300 p-5"
          >
            <h4 className="text-xs font-bold uppercase text-base-content/50 mb-4 tracking-wider">Classification</h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-base-content/50 mb-1">Status</p>
                <div className="badge badge-outline font-medium">{ticket.status || 'TODO'}</div>
              </div>
              
              {ticket.priority && (
                <div>
                  <p className="text-xs text-base-content/50 mb-1">Priority Level</p>
                  <div className={`badge font-medium ${ticket.priority === 'high' ? 'badge-error' : ticket.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                    {ticket.priority.toUpperCase()}
                  </div>
                </div>
              )}

              {ticket.relatedSkills?.length > 0 && (
                <div>
                  <p className="text-xs text-base-content/50 mb-2">Required Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.relatedSkills.map(skill => (
                      <span key={skill} className="badge badge-sm badge-secondary badge-outline bg-secondary/5 font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-base-100/80 backdrop-blur-md rounded-2xl shadow-xl border border-base-300 p-5"
          >
            <h4 className="text-xs font-bold uppercase text-base-content/50 mb-4 tracking-wider">System Info</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-base-200 pb-2">
                <span className="text-base-content/60">Created</span>
                <span className="font-mono text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-base-200 pb-2">
                <span className="text-base-content/60">Time</span>
                <span className="font-mono text-xs">{new Date(ticket.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Assignee</span>
                <span className="font-mono text-xs max-w-[120px] truncate">{ticket.assignedTo?.email || 'Unassigned'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}