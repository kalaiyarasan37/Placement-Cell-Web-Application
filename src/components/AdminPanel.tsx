
  // Fetch companies and set up real-time subscription
  useEffect(() => {
    fetchCompanies();
    fetchDashboardStats();
    fetchRecentActivities();
    
    // Set up real-time subscription for companies table
    const companiesSubscription = supabase
      .channel('companies-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'companies' }, 
        () => {
          console.log('Companies changed, fetching updated data');
          fetchCompanies();
          fetchDashboardStats();
          fetchRecentActivities();
        }
      )
      .subscribe();
    
    // Set up real-time subscription for profiles table
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          console.log('Profiles changed, fetching updated data');
          fetchDashboardStats();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for students table
    const studentsSubscription = supabase
      .channel('students-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Students changed, fetching updated data');
          fetchDashboardStats();
          fetchRecentActivities();
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      companiesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      studentsSubscription.unsubscribe();
    };
  }, []);
