import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Folder from 'lucide-react/dist/esm/icons/folder';
import FolderPlus from 'lucide-react/dist/esm/icons/folder-plus';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

import { useSetlistStore } from '@/store/setlistStore';
import type { Folder as FolderType, Setlist } from '@/types/setlist';
import SetlistDetail from '@/components/SetlistDetail';

interface SetlistsTabProps {
  userId: string;
}

export default function SetlistsTab({ userId }: SetlistsTabProps) {
  const { folders, setlists, isLoaded, fetchSetlists, createFolder, deleteFolder, createSetlist, deleteSetlist } = useSetlistStore();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  
  // Modals state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreateSetlistModalOpen, setIsCreateSetlistModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load if not loaded
  useEffect(() => {
    if (!isLoaded && userId) {
      fetchSetlists(userId);
    }
  }, [isLoaded, userId, fetchSetlists]);

  // Derived state for the current view
  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parentFolderId === currentFolderId);
  }, [folders, currentFolderId]);

  const currentSetlists = useMemo(() => {
    return setlists.filter(s => s.folderId === currentFolderId);
  }, [setlists, currentFolderId]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: FolderType[] = [];
    let curr = currentFolderId;
    while (curr) {
      const f = folders.find(f => f.id === curr);
      if (f) {
        crumbs.unshift(f);
        curr = f.parentFolderId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [folders, currentFolderId]);

  // Handlers
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isCreating) return;
    
    setIsCreating(true);
    const newFolder: FolderType = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      ownerId: userId,
      parentFolderId: currentFolderId,
      createdAt: new Date().toISOString()
    };
    
    await createFolder(newFolder);
    setNewItemName('');
    setIsCreateFolderModalOpen(false);
    setIsCreating(false);
  };

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isCreating) return;
    
    setIsCreating(true);
    const newSetlist: Setlist = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      description: null,
      folderId: currentFolderId,
      ownerId: userId,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await createSetlist(newSetlist);
    setNewItemName('');
    setIsCreateSetlistModalOpen(false);
    setIsCreating(false);
  };

  const handleDeleteFolder = async (id: string) => {
    // Check if empty first
    const hasSubFolders = folders.some(f => f.parentFolderId === id);
    const hasSetlists = setlists.some(s => s.folderId === id);
    if (hasSubFolders || hasSetlists) {
      alert("Cannot delete a folder that is not empty!");
      setMenuOpenId(null);
      return;
    }

    setDeletingId(id);
    await deleteFolder(id);
    setDeletingId(null);
    setMenuOpenId(null);
  };

  const handleDeleteSetlist = async (id: string) => {
    setDeletingId(id);
    await deleteSetlist(id);
    setDeletingId(null);
    setMenuOpenId(null);
  };

  if (activeSetlistId) {
    return (
      <div className="flex-1 w-full h-full relative">
        <SetlistDetail 
          setlistId={activeSetlistId} 
          onBack={() => setActiveSetlistId(null)}
          onNavigateToFolder={(folderId) => {
            setCurrentFolderId(folderId);
            setActiveSetlistId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-sm font-bold font-[family-name:var(--font-outfit)] text-[var(--sol-base3)]">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 hover:text-[var(--sol-cyan)] transition-colors opacity-80"
          >
            Library
          </button>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} className="text-[var(--sol-base01)]/50 flex-shrink-0" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-[var(--sol-cyan)] transition-colors ${idx === breadcrumbs.length - 1 ? 'text-[var(--sol-cyan)]' : 'opacity-80'} whitespace-nowrap`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {breadcrumbs.length < 5 && (
             <button 
             onClick={() => setIsCreateFolderModalOpen(true)}
             className="p-2 rounded-full hover:bg-white/5 text-[var(--sol-base01)] hover:text-[var(--sol-cyan)] transition-colors cursor-pointer"
             title="New Folder"
           >
             <FolderPlus size={18} />
           </button>
          )}
          <button 
            onClick={() => setIsCreateSetlistModalOpen(true)}
            className="p-2 rounded-full hover:bg-white/5 text-[var(--sol-base01)] hover:text-[var(--sol-cyan)] transition-colors cursor-pointer"
            title="New Setlist"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-20">
        {currentFolders.length === 0 && currentSetlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 pb-10 opacity-70">
            <ListMusic size={48} className="text-[var(--sol-cyan)] mb-4" />
            <h3 className="text-xl font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">It's quiet here</h3>
            <p className="text-sm text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] mt-2">Create a setlist or a folder to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {/* Folders */}
            <AnimatePresence>
            {currentFolders.map((f, i) => (
              <motion.div 
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center p-4 bg-[var(--sol-base02)]/30 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group"
                onClick={() => setCurrentFolderId(f.id)}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--sol-cyan)]/10 flex items-center justify-center mr-4">
                  <Folder size={18} className="text-[var(--sol-cyan)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">{f.name}</p>
                </div>
                
                {/* Context Menu for Folder */}
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === f.id ? null : f.id); }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors md:opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} className="text-[var(--sol-base01)]" />
                  </button>
                  <AnimatePresence>
                    {menuOpenId === f.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-0 top-full mt-2 z-50 bg-[var(--sol-base02)] border border-white/10 rounded-xl shadow-xl min-w-[150px] overflow-hidden"
                      >
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-[var(--sol-red)] hover:bg-[var(--sol-red)]/10 font-[family-name:var(--font-montserrat)]"
                          >
                            {deletingId === f.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete Folder
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>

            {/* Setlists */}
            <AnimatePresence>
            {currentSetlists.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (currentFolders.length + i) * 0.05 }}
                className="flex items-center p-4 bg-[var(--sol-base02)]/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group"
                onClick={() => {
                  setActiveSetlistId(s.id);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--sol-base01)]/10 flex items-center justify-center mr-4">
                  <ListMusic size={18} className="text-[var(--sol-base01)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">{s.name}</p>
                  <p className="text-xs text-[var(--sol-base01)] mt-0.5 font-[family-name:var(--font-montserrat)] opacity-70">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>

                 {/* Context Menu for Setlist */}
                 <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors md:opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} className="text-[var(--sol-base01)]" />
                  </button>
                  <AnimatePresence>
                    {menuOpenId === s.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-0 top-full mt-2 z-50 bg-[var(--sol-base02)] border border-white/10 rounded-xl shadow-xl min-w-[150px] overflow-hidden"
                      >
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(s.id); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-[var(--sol-red)] hover:bg-[var(--sol-red)]/10 font-[family-name:var(--font-montserrat)]"
                          >
                            {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete Setlist
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isCreateFolderModalOpen || isCreateSetlistModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreateFolderModalOpen(false);
                setIsCreateSetlistModalOpen(false);
                setNewItemName('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-sm bg-[var(--sol-base03)] border border-white/10 rounded-3xl p-6 shadow-2xl antialiased subpixel-antialiased"
              style={{ transform: "translateZ(0)", willChange: "opacity" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[var(--sol-cyan)]/10 flex items-center justify-center">
                  {isCreateFolderModalOpen ? <FolderPlus size={18} className="text-[var(--sol-cyan)]" /> : <Plus size={18} className="text-[var(--sol-cyan)]" />}
                </div>
                <h2 className="text-xl font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">
                  {isCreateFolderModalOpen ? 'New Folder' : 'New Setlist'}
                </h2>
              </div>
              
              <form onSubmit={isCreateFolderModalOpen ? handleCreateFolder : handleCreateSetlist}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter name..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 rounded-xl px-4 py-3 text-sm text-[var(--sol-base3)] placeholder-[var(--sol-base01)]/50 focus:outline-none focus:border-[var(--sol-cyan)]/50 transition-colors font-[family-name:var(--font-montserrat)] mb-6"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateFolderModalOpen(false);
                      setIsCreateSetlistModalOpen(false);
                      setNewItemName('');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold text-[var(--sol-base01)] hover:bg-white/5 transition-colors font-[family-name:var(--font-montserrat)]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={!newItemName.trim() || isCreating}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[var(--sol-cyan)] text-[var(--sol-base03)] disabled:opacity-50 hover:opacity-90 transition-opacity font-[family-name:var(--font-montserrat)] flex items-center gap-2"
                  >
                    {isCreating && <Loader2 size={12} className="animate-spin" />}
                    CREATE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
