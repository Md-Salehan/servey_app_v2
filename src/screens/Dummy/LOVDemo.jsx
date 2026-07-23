import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React, { useState, useMemo } from 'react'
import { LOVField } from '../../components'

const LOVDemo = () => {
  // State for single selection
  const [selectedValue, setSelectedValue] = useState(null);
  
  // State for multiple selection
  const [selectedMultiple, setSelectedMultiple] = useState([]);

  // State for dependent LOVs
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Sample data - Departments
  const departmentData = [
    { id: 1, name: 'Engineering', code: 'ENG', location: 'Building A' },
    { id: 2, name: 'Sales', code: 'SAL', location: 'Building B' },
    { id: 3, name: 'Marketing', code: 'MKT', location: 'Building C' },
    { id: 4, name: 'Human Resources', code: 'HR', location: 'Building A' },
  ];

  // Sample data - Employees (dependent on department)
  const allEmployees = [
    // Engineering
    { id: 101, name: 'Alice Johnson', email: 'alice@eng.com', departmentId: 1, role: 'Senior Developer', projectId: 1 },
    { id: 102, name: 'Bob Smith', email: 'bob@eng.com', departmentId: 1, role: 'Developer', projectId: 1 },
    { id: 103, name: 'Carol Davis', email: 'carol@eng.com', departmentId: 1, role: 'QA Engineer', projectId: 2 },
    { id: 104, name: 'David Miller', email: 'david@eng.com', departmentId: 1, role: 'DevOps', projectId: 2 },
    // Sales
    { id: 201, name: 'Eva Garcia', email: 'eva@sales.com', departmentId: 2, role: 'Sales Manager', projectId: 3 },
    { id: 202, name: 'Frank Chen', email: 'frank@sales.com', departmentId: 2, role: 'Account Executive', projectId: 3 },
    { id: 203, name: 'Grace Lee', email: 'grace@sales.com', departmentId: 2, role: 'Sales Representative', projectId: 4 },
    // Marketing
    { id: 301, name: 'Henry Wilson', email: 'henry@mkt.com', departmentId: 3, role: 'Marketing Director', projectId: 4 },
    { id: 302, name: 'Ivy Martinez', email: 'ivy@mkt.com', departmentId: 3, role: 'Content Strategist', projectId: 5 },
    // HR
    { id: 401, name: 'Jack Taylor', email: 'jack@hr.com', departmentId: 4, role: 'HR Manager', projectId: 5 },
    { id: 402, name: 'Karen White', email: 'karen@hr.com', departmentId: 4, role: 'Recruiter', projectId: 6 },
  ];

  // Sample data - Projects (dependent on department)
  const allProjects = [
    { id: 1, name: 'Mobile App Development', departmentId: 1, status: 'Active' },
    { id: 2, name: 'Cloud Migration', departmentId: 1, status: 'Planning' },
    { id: 3, name: 'Q4 Sales Campaign', departmentId: 2, status: 'Active' },
    { id: 4, name: 'Market Research', departmentId: 2, status: 'Completed' },
    { id: 5, name: 'Brand Refresh', departmentId: 3, status: 'Active' },
    { id: 6, name: 'Employee Wellness Program', departmentId: 4, status: 'Planning' },
  ];

  // Column configurations
  const departmentColumns = [
    { key: 'id', title: 'ID', width: 50 },
    { key: 'code', title: 'Code', width: 80 },
    { key: 'name', title: 'Department Name', width: 140 },
    { key: 'location', title: 'Location', width: 110 },
  ];

  const employeeColumns = [
    { key: 'id', title: 'ID', width: 50 },
    { key: 'name', title: 'Employee Name', width: 150 },
    { key: 'email', title: 'Email', width: 180 },
    { key: 'role', title: 'Role', width: 130 },
  ];

  const projectColumns = [
    { key: 'id', title: 'ID', width: 50 },
    { key: 'name', title: 'Project Name', width: 160 },
    { key: 'status', title: 'Status', width: 100 },
  ];

  // Filter employees based on selected department
  const filteredEmployees = useMemo(() => {
    if (!selectedDepartment) return [];
    return allEmployees.filter(emp => emp.departmentId === selectedDepartment);
  }, [selectedDepartment]);

  // Filter projects based on selected department
  const filteredProjects = useMemo(() => {
    if (!selectedDepartment) return [];
    return allProjects.filter(proj => proj.departmentId === selectedDepartment);
  }, [selectedDepartment]);

  // Get display text for employees
  const getEmployeeDisplayText = (selected) => {
    if (!selected || selected.length === 0) return 'Select employees...';
    if (selected.length === 1) {
      const emp = allEmployees.find(e => e.id === selected[0]);
      return emp ? emp.name : 'Select employees...';
    }
    return `${selected.length} employees selected`;
  };

  // Get display text for project
  const getProjectDisplayText = (selected) => {
    if (!selected) return 'Select project...';
    const project = allProjects.find(p => p.id === selected);
    return project ? project.name : 'Select project...';
  };

  // Custom row renderer for employees with role highlighting
  const renderEmployeeRow = ({ item, isSelected }) => (
    <View style={[styles.customRow, isSelected && styles.customRowSelected]}>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.role}</Text>
      </View>
      <View style={styles.employeeEmailContainer}>
        <Text style={styles.employeeEmail}>{item.email}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Dependent LOV Example</Text>
      <Text style={styles.subHeader}>Select a department to see related employees and projects</Text>

      {/* Department LOV - Parent */}
      <LOVField
        fcId="department-select"
        label="Department"
        placeholder="Select a department..."
        data={departmentData}
        columns={departmentColumns}
        value={selectedDepartment}
        onChange={(value) => {
          setSelectedDepartment(value);
          // Reset dependent selections when department changes
          setSelectedEmployees([]);
          setSelectedProject(null);
        }}
        displayKey="name"
        primaryKey="id"
        required={true}
        searchable={true}
        searchPlaceholder="Search departments..."
        modalTitle="Select Department"
        showSelectionCount={true}
      />

      {/* Employee LOV - Dependent on Department */}
      <View style={styles.dependentFieldContainer}>
        <Text style={styles.dependentLabel}>
          {selectedDepartment ? 'Employees in Selected Department' : 'Select Department First'}
        </Text>
        <LOVField
          fcId="employee-select"
          label="Select Employees"
          placeholder={selectedDepartment ? "Select employees..." : "Please select a department first"}
          data={filteredEmployees}
          columns={employeeColumns}
          value={selectedEmployees}
          onChange={setSelectedEmployees}
          multiple={true}
          maxSelections={5}
          displayKey="name"
          primaryKey="id"
          searchable={true}
          searchPlaceholder="Search employees..."
          modalTitle="Select Employees"
          disabled={!selectedDepartment}
          required={!!selectedDepartment}
          showSelectionCount={true}
          renderRowItem={renderEmployeeRow}
          // dependencyValues={[selectedDepartment]} // This will clear selection when department changes
        />
        {selectedDepartment && filteredEmployees.length === 0 && (
          <Text style={styles.noDataText}>No employees found in this department</Text>
        )}
      </View>

      {/* Project LOV - Dependent on Department (Single Select) */}
      <View style={styles.dependentFieldContainer}>
        <Text style={styles.dependentLabel}>
          {selectedDepartment ? 'Projects in Selected Department' : 'Select Department First'}
        </Text>
        <LOVField
          fcId="project-select"
          label="Select Project"
          placeholder={selectedDepartment ? "Select project..." : "Please select a department first"}
          data={filteredProjects}
          columns={projectColumns}
          value={selectedProject}
          onChange={setSelectedProject}
          displayKey="name"
          primaryKey="id"
          searchable={true}
          searchPlaceholder="Search projects..."
          modalTitle="Select Project"
          disabled={!selectedDepartment}
          required={!!selectedDepartment}
          showSelectionCount={true}
          // dependencyValues={[selectedDepartment]} // This will clear selection when department changes
        />
        {selectedDepartment && filteredProjects.length === 0 && (
          <Text style={styles.noDataText}>No projects found in this department</Text>
        )}
      </View>

      {/* Display selected values for debugging */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Selected Values Summary</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Department:</Text>
          <Text style={styles.summaryValue}>
            {selectedDepartment 
              ? departmentData.find(d => d.id === selectedDepartment)?.name || 'Unknown'
              : 'None selected'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Employees:</Text>
          <Text style={styles.summaryValue}>
            {selectedEmployees.length > 0 
              ? `${selectedEmployees.length} selected: ${selectedEmployees.map(id => 
                  allEmployees.find(e => e.id === id)?.name || ''
                ).join(', ')}`
              : 'None selected'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Project:</Text>
          <Text style={styles.summaryValue}>
            {selectedProject 
              ? allProjects.find(p => p.id === selectedProject)?.name || 'Unknown'
              : 'None selected'}
          </Text>
        </View>
      </View>

      {/* Additional LOV Examples */}
      <Text style={styles.sectionTitle}>Additional Examples</Text>

      {/* Disabled LOV */}
      <LOVField
        fcId="disabled-select"
        label="Disabled Field"
        placeholder="This is disabled"
        data={departmentData}
        columns={departmentColumns}
        value="2"
        disabled={true}
        displayKey="name"
        primaryKey="id"
      />

      {/* Preview Mode LOV */}
      <LOVField
        fcId="preview-select"
        label="Preview Field"
        placeholder="Preview mode"
        data={departmentData}
        columns={departmentColumns}
        value="3"
        isPreview={true}
        displayKey="name"
        primaryKey="id"
      />
    </ScrollView>
  )
}

export default LOVDemo

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  dependentFieldContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dependentLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  noDataText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
    marginLeft: 4,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 100,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  // Custom row styles for employees
  customRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customRowSelected: {
    backgroundColor: '#e3f2fd',
  },
  employeeInfo: {
    flex: 2,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  employeeRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  employeeEmailContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  employeeEmail: {
    fontSize: 12,
    color: '#888',
  },
});