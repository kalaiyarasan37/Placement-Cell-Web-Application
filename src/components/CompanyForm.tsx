
import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  company?: Company;
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
      postedBy: currentUser?.id || '',
    }
  );
  
  const [newPosition, setNewPosition] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddPosition = () => {
    if (newPosition.trim() && formData.positions) {
      setFormData({
        ...formData,
        positions: [...formData.positions, newPosition.trim()]
      });
      setNewPosition('');
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim() && formData.requirements) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
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

  const saveToDatabase = async () => {
    try {
      setIsSubmitting(true);
      
      // Format the data for Supabase
      const companyData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        positions: formData.positions,
        requirements: formData.requirements,
        deadline: formData.deadline,
        posted_by: currentUser?.id
      };
      
      let result;
      
      if (company?.id) {
        // Update existing company
        result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id);
      } else {
        // Insert new company
        result = await supabase
          .from('companies')
          .insert(companyData)
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Call the onSave prop with the Supabase response data
      const savedCompany = result.data?.[0] || formData;
      onSave(savedCompany);
      
      toast({
        title: company ? "Company Updated" : "Company Added",
        description: `${formData.name} has been ${company ? "updated" : "added"} successfully.`,
      });
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: `Failed to ${company ? "update" : "add"} company: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name || !formData.description || !formData.location || !formData.deadline) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.positions?.length === 0) {
      toast({
        title: "No Positions",
        description: "Please add at least one position.",
        variant: "destructive",
      });
      return;
    }
    
    saveToDatabase();
  };

  return (
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
            <Label htmlFor="name">Company Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Positions</Label>
            <div className="flex gap-2">
              <Input 
                value={newPosition} 
                onChange={(e) => setNewPosition(e.target.value)}
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
            <Label>Requirements</Label>
            <div className="flex gap-2">
              <Input 
                value={newRequirement} 
                onChange={(e) => setNewRequirement(e.target.value)}
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
            <Label htmlFor="deadline">Application Deadline</Label>
            <Input 
              id="deadline" 
              name="deadline" 
              type="date"
              value={formData.deadline} 
              onChange={handleInputChange} 
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
  );
};

export default CompanyForm;
