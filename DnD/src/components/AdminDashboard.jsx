import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/AdminService';
import { Save, RefreshCw, Upload, Edit, Trash2 } from 'lucide-react';

const CollectionEditor = ({ collectionName, title }) => {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editJson, setEditJson] = useState('');
  const [loading, setLoading] = useState(false);

  const templates = {
    [AdminService.COLLECTIONS.CAMPAIGNS]: (id) => ({
      id,
      title: 'New Campaign',
      description: 'Describe the campaign goal, tone, and expectations.',
      price: 0,
      adventureOrder: []
    }),
    [AdminService.COLLECTIONS.ADVENTURES]: (id) => ({
      id,
      title: 'New Adventure',
      start_node: 'intro',
      nodes: {
        intro: {
          text: 'Opening scene description.',
          choices: []
        }
      }
    }),
    default: (id) => ({ id, name: 'New Item' })
  };

  const buildTemplate = (id) => {
    if (templates[collectionName]) return templates[collectionName](id);
    return templates.default(id);
  };

  const fetchItems = async () => {
    setLoading(true);
    const data = await AdminService.getAllContent(collectionName);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditJson(JSON.stringify(item, null, 2));
  };

  const handleSave = async () => {
    try {
      const data = JSON.parse(editJson);
      if (!data.id) return alert("JSON must contain an 'id' field.");

      await AdminService.saveContent(collectionName, data.id, data);
      setEditingId(data.id);
      fetchItems();
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  const handleCreate = () => {
      const newId = `new_${Date.now()}`;
      setEditingId(newId);
      setEditJson(JSON.stringify(buildTemplate(newId), null, 2));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-200">{title}</h3>
        <div className="flex gap-2">
            <button onClick={fetchItems} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><RefreshCw size={16}/></button>
            <button onClick={handleCreate} className="px-3 py-2 bg-green-700 rounded hover:bg-green-600 text-sm font-bold flex items-center gap-1"><Upload size={16}/> New</button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* List */}
        <div className="w-1/3 bg-slate-800 rounded-lg p-2 overflow-y-auto custom-scrollbar">
          {loading ? <div className="text-center p-4">Loading...</div> : items.map(item => (
            <div
              key={item.id}
              onClick={() => handleEdit(item)}
              className={`p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors ${editingId === item.id ? 'bg-slate-700 border-l-4 border-l-dnd-accent' : ''}`}
            >
              <div className="font-bold text-slate-200">{item.name || item.title || item.id}</div>
              <div className="text-xs text-slate-500">{item.id}</div>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="w-2/3 bg-slate-900 rounded-lg border border-slate-700 flex flex-col">
          {editingId ? (
            <>
              <div className="p-2 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Editing: {editingId}</span>
                <button onClick={handleSave} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1">
                    <Save size={14} /> Save Changes
                </button>
              </div>
              <textarea
                className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-sm p-4 outline-none resize-none"
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 italic">
              Select an item to edit JSON
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('items');
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
      if(!confirm("This will overwrite existing data in Firestore with local JSON files. Continue?")) return;
      setSeeding(true);
      try {
          await AdminService.seedDatabase();
          alert("Seeding Complete. Content successfully uploaded to Firestore.");
      } catch (e) {
          console.error(e);
          if (e.code === 'permission-denied') {
              alert("Seeding Failed: Permission Denied.\n\nPlease ensure your Firestore Rules allow writes to 'content_*' collections for authenticated users.\n\nSee 'firestore.rules' in the project root for the required configuration.");
          } else {
              alert("Seeding Failed: " + e.message);
          }
      } finally {
          setSeeding(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black text-slate-300 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <span className="bg-red-900/20 border border-red-900 px-2 py-0.5 rounded text-sm">ADMIN</span>
            Content Manager
        </h1>
        <div className="flex gap-4">
            <button onClick={handleSeed} disabled={seeding} className="text-yellow-600 hover:text-yellow-400 text-sm font-bold">
                {seeding ? 'Seeding...' : 'Seed DB from Local JSON'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">Exit</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-6">
        {[
            { id: 'items', label: 'Items', coll: AdminService.COLLECTIONS.ITEMS },
            { id: 'monsters', label: 'Monsters', coll: AdminService.COLLECTIONS.MONSTERS },
            { id: 'spells', label: 'Spells', coll: AdminService.COLLECTIONS.SPELLS },
            { id: 'adventures', label: 'Adventures', coll: AdminService.COLLECTIONS.ADVENTURES },
            { id: 'campaigns', label: 'Campaigns', coll: AdminService.COLLECTIONS.CAMPAIGNS },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden bg-slate-950">
         {activeTab === 'items' && <CollectionEditor collectionName={AdminService.COLLECTIONS.ITEMS} title="Item Registry" />}
         {activeTab === 'monsters' && <CollectionEditor collectionName={AdminService.COLLECTIONS.MONSTERS} title="Monster Bestiary" />}
         {activeTab === 'spells' && <CollectionEditor collectionName={AdminService.COLLECTIONS.SPELLS} title="Spell Grimoire" />}
         {activeTab === 'adventures' && <CollectionEditor collectionName={AdminService.COLLECTIONS.ADVENTURES} title="Adventure Modules" />}
         {activeTab === 'campaigns' && <CollectionEditor collectionName={AdminService.COLLECTIONS.CAMPAIGNS} title="Campaign Bundles" />}
      </div>
    </div>
  );
};

export default AdminDashboard;
