import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Link as LinkIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGroupStore } from '@/stores/groupStore';
import { Link } from 'react-router-dom';

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { groups, isLoading, error, fetchUserGroups, createGroup, joinGroup } = useGroupStore();

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  const displayGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      await createGroup(newGroupName, newGroupDescription);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    try {
      await joinGroup(inviteCode);
      setShowJoinModal(false);
      setInviteCode('');
    } catch (err) {
      console.error('Failed to join group:', err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">Groups</h1>
            <p className="text-muted-foreground">
              Join groups to watch movies together and chat with friends
            </p>
          </div>

          <div className="flex gap-3">
            {/* Join Group */}
            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Invite Code</Label>
                    <Input
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    className="w-full btn-cinema"
                  >
                    {isJoining ? 'Joining...' : 'Join Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Group */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="btn-cinema">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Group Name</Label>
                    <Input
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="What's your group about?"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={isCreating}
                    className="w-full btn-cinema"
                  >
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/50"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        ) : (
          <>
            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGroups.map((group, index) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/groups/${group._id}`}>
                    <div className="glass-panel rounded-xl overflow-hidden hover:ring-2 ring-primary/50 transition-all cursor-pointer">
                      {/* Cover */}
                      <div className="h-32 bg-gradient-to-br from-primary via-primary/50 to-background relative" />

                      {/* Content */}
                      <div className="p-4 -mt-8 relative">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-3 font-semibold text-lg">
                          {group.name.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {group.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{group.members.length} members</span>
                          </div>
                          <div className="flex -space-x-2">
                            {group.members.slice(0, 3).map((member) => (
                              <img
                                key={member.userId._id}
                                src={member.userId.avatar}
                                alt={member.userId.username}
                                className="w-6 h-6 rounded-full border-2 border-card"
                              />
                            ))}
                            {group.members.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                +{group.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {displayGroups.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {groups.length === 0 ? 'No groups yet' : 'No matching groups'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {groups.length === 0
                    ? 'Create a new group or join one with an invite code'
                    : 'Try adjusting your search'}
                </p>
                {groups.length === 0 && (
                  <Button onClick={() => setShowCreateModal(true)} className="btn-cinema">
                    Create Your First Group
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
