import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useGameStore from '../store/useGameStore';
import { AdminService } from '../services/AdminService';
import { ShoppingCart, Play } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';

const StoreModal = ({ isOpen, onClose }) => {
  const { purchasedContent, addPurchase } = useAuthStore();
  const { startAdventure } = useGameStore();
  const [adventures, setAdventures] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
        const loadContent = async () => {
            setLoading(true);
            const advs = await AdminService.getAllContent(AdminService.COLLECTIONS.ADVENTURES);
            const camps = await AdminService.getAllContent(AdminService.COLLECTIONS.CAMPAIGNS);
            setAdventures(advs);
            setCampaigns(camps);
            setLoading(false);
        };
        loadContent();
    }
  }, [isOpen]);

  const handlePurchase = (id) => {
      addPurchase(id);
      alert("Purchase successful! Content unlocked.");
  };

  const handleStart = (contentId, type) => {
      if (type === 'campaign') {
          // Find first adventure in campaign
          const campaign = campaigns.find(c => c.id === contentId);
          if (campaign && campaign.adventureOrder && campaign.adventureOrder.length > 0) {
              startAdventure(campaign.adventureOrder[0], contentId);
              onClose();
          } else {
              alert("This campaign has no adventures yet.");
          }
      } else {
          startAdventure(contentId);
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[700px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShoppingCart className="text-dnd-accent" /> Adventure Store
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">Close</button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
             {loading ? <div className="text-center text-slate-500">Loading Content...</div> : (
                 <div className="space-y-8">
                     {/* Campaigns Section */}
                     <section>
                         <h3 className="text-xl font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">Campaigns</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {campaigns.map(camp => {
                                 const isOwned = purchasedContent.includes(camp.id);
                                 return (
                                     <div key={camp.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col justify-between hover:border-yellow-600 transition-colors">
                                         <div>
                                             <div className="flex justify-between items-start mb-2">
                                                 <h4 className="font-bold text-lg text-yellow-500">{camp.title || camp.id}</h4>
                                                 {!isOwned && <span className="text-xs bg-slate-800 px-2 py-1 rounded text-green-400 font-mono">${camp.price || '0.00'}</span>}
                                             </div>
                                             <p className="text-sm text-slate-400 mb-4">{camp.description || "No description."}</p>
                                         </div>
                                         <button
                                            onClick={() => isOwned ? handleStart(camp.id, 'campaign') : handlePurchase(camp.id)}
                                            className={`w-full py-2 rounded font-bold flex items-center justify-center gap-2 ${isOwned ? 'bg-green-800 hover:bg-green-700 text-white' : 'bg-yellow-700 hover:bg-yellow-600 text-black'}`}
                                         >
                                             {isOwned ? <><Play size={16}/> Play Campaign</> : <><ShoppingCart size={16}/> Buy Now</>}
                                         </button>
                                     </div>
                                 );
                             })}
                             {campaigns.length === 0 && <div className="text-slate-600 italic">No campaigns available.</div>}
                         </div>
                     </section>

                     {/* Individual Adventures Section */}
                     <section>
                         <h3 className="text-xl font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">Individual Adventures</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {adventures.map(adv => (
                                 <div key={adv.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
                                     <div>
                                         <h4 className="font-bold text-lg text-slate-200 mb-2">{adv.title || adv.id}</h4>
                                         <p className="text-sm text-slate-400 mb-4 line-clamp-3">{adv.nodes?.intro?.text?.substring(0, 100)}...</p>
                                     </div>
                                     <button
                                        onClick={() => handleStart(adv.id, 'adventure')}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-blue-200 py-2 rounded font-bold flex items-center justify-center gap-2 border border-slate-600"
                                     >
                                         <Play size={16}/> Play Free
                                     </button>
                                 </div>
                             ))}
                             {adventures.length === 0 && <div className="text-slate-600 italic">No adventures available.</div>}
                         </div>
                     </section>
                 </div>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StoreModal;
