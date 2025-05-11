
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from 'lucide-react';
import { Company } from '../data/mockData';

interface CompanyCardProps {
  company: Company;
  canApply?: boolean;
  isEditable?: boolean;
  onEdit?: () => void;
  onApply?: () => void;
  onDelete?: () => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  canApply = false,
  isEditable = false,
  onEdit,
  onApply,
  onDelete
}) => {
  const isDeadlinePassed = new Date(company.deadline) < new Date();
  
  // Format the deadline date
  const formattedDeadline = new Date(company.deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{company.name}</CardTitle>
            <CardDescription>{company.location}</CardDescription>
          </div>
          {isEditable && (
            <div className="text-xs text-muted-foreground">
              Posted by: {company.posted_by}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{company.description}</p>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Open Positions:</h4>
          <div className="flex flex-wrap gap-2">
            {company.positions.map((position, index) => (
              <Badge key={index} variant="secondary">
                {position}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Requirements:</h4>
          <ul className="list-disc pl-5 text-sm">
            {company.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Application Deadline:</span>
            <span className="text-sm ml-2">
              {formattedDeadline}
              {isDeadlinePassed && (
                <Badge variant="outline" className="ml-2 text-red-500 border-red-200 bg-red-50">
                  Closed
                </Badge>
              )}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isEditable && (
          <>
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </>
        )}
        
        {canApply && !isDeadlinePassed && (
          <Button onClick={onApply}>
            <Briefcase className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        )}
        
        {canApply && isDeadlinePassed && (
          <Button disabled>
            Applications Closed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CompanyCard;
