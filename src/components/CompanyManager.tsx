import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash, Search, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import CompanyForm from './CompanyForm';

interface Company {
  id: string;
  name: string;
  industry?: string;
  location: string;
  website?: string;
  created_at: string;
  description: string;
  positions: string[];
  deadline: string;
  requirements: string[];
  posted_by: string;
}

const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Error",
          description: `Failed to fetch companies: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      if (data) {
        // Process the data without trying to access nonexistent fields
        const processedData = data.map(item => ({
          ...item,
          // We don't need to add industry here since it's optional in our interface
        }));
        setCompanies(processedData as Company[]);
        setFilteredCompanies(processedData as Company[]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching companies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCompanies();
    
    // Set up real-time subscription for company changes
    const companySubscription = supabase
      .channel('company-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'companies'
        }, 
        () => {
          console.log('Company data changed, refreshing data');
          fetchCompanies();
        }
      )
      .subscribe();
      
    return () => {
      companySubscription.unsubscribe();
    };
  }, []);
  
  // Filter companies based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
      return;
    }
    
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (company.industry ? company.industry.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      company.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);
  
  const handleAddCompany = () => {
    setCurrentCompany(null);
    setIsCompanyFormOpen(true);
  };
  
  const handleEditCompany = (company: Company) => {
    setCurrentCompany(company);
    setIsCompanyFormOpen(true);
  };
  
  const handleDeleteCompany = (company: Company) => {
    setCurrentCompany(company);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteCompany = async () => {
    if (!currentCompany) return;
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', currentCompany.id);
        
      if (error) {
        console.error('Error deleting company:', error);
        toast({
          title: "Error",
          description: `Failed to delete company. ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Company Deleted",
        description: `${currentCompany.name} has been removed.`,
      });
      
      setIsDeleteDialogOpen(false);
      setCurrentCompany(null);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleCompanyFormSuccess = () => {
    setIsCompanyFormOpen(false);
    setCurrentCompany(null);
    // Data will be refreshed via the real-time subscription
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Companies</CardTitle>
          <Button onClick={handleAddCompany} variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, industry or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm ? 'No companies found matching your search.' : 'No companies found. Add some!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.industry || 'N/A'}</TableCell>
                      <TableCell>{company.location}</TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditCompany(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCompany(company)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Company Form Dialog */}
      <Dialog open={isCompanyFormOpen} onOpenChange={setIsCompanyFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentCompany ? 'Edit Company' : 'Add New Company'}
            </DialogTitle>
            <DialogDescription>
              {currentCompany 
                ? 'Update company information'
                : 'Enter the details for the new company'}
            </DialogDescription>
          </DialogHeader>
          
          <CompanyForm 
            company={currentCompany} 
            onClose={() => setIsCompanyFormOpen(false)}
            isOpen={isCompanyFormOpen}
            onSave={handleCompanyFormSuccess}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentCompany?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDeleteCompany}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManager;
