
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { Company } from '../data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  company?: Company | null;  // Made null possible to match usage
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  isOpen,
  onClose,
  onSave,
  company
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Partial<Company>>(
    company || {
      name: '',
      description: '',
      location: '',
      positions: [],
      requirements: [],
      deadline: new Date().toISOString().split('T')[0],
      posted_by: currentUser?.id || '',
    }
  );
  
  // Update form data when company prop changes
  useEffect(() => {
    if (company) {
      // Ensure positions and requirements are arrays
      const positions = Array.isArray(company.positions) ? company.positions : [];
      const requirements = Array.isArray(company.requirements) ? company.requirements : [];
      
      setFormData({
        ...company,
        positions,
        requirements
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        positions: [],
        requirements: [],
        deadline: new Date().toISOString().split('T')[0],
        posted_by: currentUser?.id || '',
      });
    }
  }, [company, currentUser]);
  
  const [newPosition, setNewPosition] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddPosition = () => {
    if (newPosition.trim()) {
      const currentPositions = Array.isArray(formData.positions) ? formData.positions : [];
      setFormData({
        ...formData,
        positions: [...currentPositions, newPosition.trim()]
      });
      setNewPosition('');
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      const currentRequirements = Array.isArray(formData.requirements) ? formData.requirements : [];
      setFormData({
        ...formData,
        requirements: [...currentRequirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const handleRemovePosition = (index: number) => {
    if (formData.positions) {
      const updatedPositions = [...formData.positions];
      updatedPositions.splice(index, 1);
      setFormData({ ...formData, positions: updatedPositions });
    }
  };

  const handleRemoveRequirement = (index: number) => {
    if (formData.requirements) {
      const updatedRequirements = [...formData.requirements];
      updatedRequirements.splice(index, 1);
      setFormData({ ...formData, requirements: updatedRequirements });
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name || !formData.description || !formData.location || !formData.deadline) {
      console.log("Missing required fields", formData);
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Ensure positions and requirements are arrays and not empty
    const positions = Array.isArray(formData.positions) ? formData.positions : [];
    const requirements = Array.isArray(formData.requirements) ? formData.requirements : [];
    
    if (positions.length === 0 || requirements.length === 0) {
      console.log("Positions or requirements are empty");
      toast({
        title: "Error",
        description: "Please add at least one position and one requirement",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data with arrays
      const finalData = {
        ...formData,
        positions,
        requirements,
        // Make sure to remove any ID if this is a new company (to avoid uuid errors)
        ...(company ? {} : { id: undefined }),
        // Set a default poster ID if none is provided
        posted_by: formData.posted_by || currentUser?.id || 'system'
      };
      
      // Pass the data back to parent component
      onSave(finalData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Handle Enter key in position and requirement inputs
  const handlePositionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPosition();
    }
  };

  const handleRequirementKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRequirement();
    }
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
            <DialogDescription>
              {company ? 'Update company information in the system.' : 'Add a new company to the recruitment system.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name || ''} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input 
                id="location" 
                name="location" 
                value={formData.location || ''} 
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description || ''} 
                onChange={handleInputChange} 
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Positions *</Label>
              <div className="flex gap-2">
                <Input 
                  value={newPosition} 
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={handlePositionKeyDown}
                  placeholder="Add a position"
                />
                <Button type="button" onClick={handleAddPosition} className="shrink-0">
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.positions?.map((position, index) => (
                  <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md flex items-center gap-2">
                    {position}
                    <button 
                      onClick={() => handleRemovePosition(index)}
                      className="text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Requirements *</Label>
              <div className="flex gap-2">
                <Input 
                  value={newRequirement} 
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={handleRequirementKeyDown}
                  placeholder="Add a requirement"
                />
                <Button type="button" onClick={handleAddRequirement} className="shrink-0">
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {formData.requirements?.map((requirement, index) => (
                  <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md flex items-center justify-between">
                    <span>{requirement}</span>
                    <button 
                      onClick={() => handleRemoveRequirement(index)}
                      className="text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline *</Label>
              <Input 
                id="deadline" 
                name="deadline" 
                type="date"
                value={formData.deadline || ''} 
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : company ? 'Update Company' : 'Add Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyForm;
