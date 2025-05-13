
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import type { Company } from '../data/mockData'; // Use the existing Company type

interface CompanyDisplayProps {
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onEdit?: (company: Company) => void;
}

const CompanyDisplay: React.FC<CompanyDisplayProps> = ({ 
  isAdmin = false, 
  isSuperAdmin = false,
  onEdit
}) => {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
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
        // Process the data to ensure proper typing
        const processedData = data.map(item => ({
          ...item,
          positions: Array.isArray(item.positions) ? item.positions : [],
          requirements: Array.isArray(item.requirements) ? item.requirements : []
        }));
        
        setCompanies(processedData as Company[]);
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
  
  // Set up real-time subscription for company changes
  React.useEffect(() => {
    fetchCompanies();
    
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
  
  const handleEditCompany = (company: Company) => {
    if (onEdit) {
      onEdit(company);
    }
  };
  
  const handleDeleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
        
      if (error) {
        console.error('Error deleting company:', error);
        toast({
          title: "Error",
          description: `Failed to delete company: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Company Deleted",
        description: "The company has been successfully removed.",
      });
      
      // The real-time subscription will update the UI
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
  
  if (isLoading) {
    return <div className="text-center py-4">Loading companies...</div>;
  }
  
  if (companies.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No companies found.</div>;
  }
  
  return (
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
          {companies.map((company) => (
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
                    onClick={() => handleDeleteCompany(company.id)}
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
  );
};

export default CompanyDisplay;
