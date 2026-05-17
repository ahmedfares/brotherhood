import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#c5a85c', '#0e5968', '#2fb889', '#f59e0b', '#d86b5b', '#86a89b', '#9a7a31', '#4f8f9a', '#e4c987'];

const fallbackExpectedValues = {
  Rent: 1200,
  Charity: 1200,
  Food: 500,
  Electricity: 100,
  Internet: 40,
  Insurance: 75,
  Expenses: 285,
  Fuel: 100
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(5, 22, 29, 0.92)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(197,168,92,0.24)', color: '#fff', backdropFilter: 'blur(10px)' }}>
        <p className="label" style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{`${payload[0].name || payload[0].payload.argument}`}</p>
        <p className="desc" style={{ margin: '4px 0 0 0', color: payload[0].payload.fill || '#fff', fontSize: '14px' }}>
          ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const BudgetProgressBar = ({ category, actual, expected }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  // If expected is 0, avoid division by zero
  const percentage = expected > 0 ? (actual / expected) * 100 : 0;
  
  // Cap width at 100% for the visual bar
  const visualPercentage = Math.min(percentage, 100);
  
  // Logic: if actual < expected, green. If actual >= expected, red.
  const isOverBudget = actual >= expected;
  const barColorClass = isOverBudget ? 'bg-danger-stripe' : 'bg-success-stripe';

  // Trigger the width animation shortly after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(visualPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [visualPercentage]);

  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{category}</span>
        <div className="progress-stats">
          <span className="progress-actual">${actual.toFixed(2)}</span>
          <span className="progress-separator">/</span>
          <span className="progress-expected">${expected.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Tooltip Wrapper */}
      <div 
        className="progress-track tooltip-wrapper" 
        title={`${category}: ${percentage.toFixed(1)}% of budget used${isOverBudget ? ' (Over Budget!)' : ''}`}
      >
        <div 
          className={`progress-fill ${barColorClass}`} 
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [payments, setPayments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize with current year and month using a single month-picker value (YYYY-MM)
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthPicker, setSelectedMonthPicker] = useState(defaultMonth);
  const [showFullYear, setShowFullYear] = useState(false);
  
  // Derive year/month from picker for API
  const selectedYear = selectedMonthPicker ? selectedMonthPicker.split('-')[0] : 'All';
  const selectedMonth = showFullYear ? 'All' : selectedMonthPicker ? (parseInt(selectedMonthPicker.split('-')[1], 10) - 1).toString() : 'All';
  const selectedYearNumber = parseInt(selectedYear, 10);
  const currentYear = currentDate.getFullYear();
  const expectedBudgetMultiplier = showFullYear
    ? selectedYearNumber < currentYear
      ? 12
      : selectedYearNumber === currentYear
        ? currentDate.getMonth() + 1
        : 0
    : 1;
  
  // Chart Selector State
  const [selectedChart, setSelectedChart] = useState('progress'); // 'progress', 'category', 'owner'

  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.classList.add('dashboard-no-scroll');
    }

    return () => {
      if (contentArea) {
        contentArea.classList.remove('dashboard-no-scroll');
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Pass filters to server. limit=1000 to get all data for the period for charts.
        const [paymentsRes, ownersRes, categoriesRes] = await Promise.all([
          api.get(`/payments?year=${selectedYear}&month=${selectedMonth}&limit=1000`),
          api.get('/owners'),
          api.get('/collections')
        ]);
        
        if (paymentsRes.data.status === 'success') {
          setPayments(paymentsRes.data.data);
        } else {
          setPayments(paymentsRes.data);
        }
        setOwners(ownersRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth]); // Trigger fetch when filters change


  // Only show the full-screen loader on initial mount when we have no data
  if (loading && payments.length === 0) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  // Data Processing
  let categoryData = [];
  let ownerData = [];
  let budgetData = [];
  let totalExpenses = 0;
  let totalExpectedBudget = 0;

  if (owners.length > 0 && categories.length > 0) {
    // 1. Data is already filtered by the server
    const filteredPayments = payments;

    // Process Category Pie Chart (DevExpress Format: { argument, value })
    const categoryMap = {};
    filteredPayments.forEach(obj => {
      totalExpenses += Number(obj.Amount);
      const catName = categories.find(x => String(x.collectionId) === String(obj.Category))?.collectionName || 'Unknown';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { argument: catName, value: 0 };
      }
      categoryMap[catName].value += Number(obj.Amount);
    });
    categoryData = Object.values(categoryMap);

    // Process Budget Progress Data
    const budgetMap = {};
    categories.forEach(cat => {
      const catName = cat.collectionName;
      const storedExpected = Number(cat.expectedValue);
      const monthlyExpected = Number.isFinite(storedExpected) ? storedExpected : fallbackExpectedValues[catName] || 0;
      const expected = monthlyExpected * expectedBudgetMultiplier;
      
      if (monthlyExpected > 0) {
        budgetMap[catName] = { category: catName, actual: 0, expected: expected };
      }
    });

    filteredPayments.forEach(obj => {
      const catName = categories.find(x => String(x.collectionId) === String(obj.Category))?.collectionName || 'Unknown';
      if (!budgetMap[catName]) {
        budgetMap[catName] = { category: catName, actual: 0, expected: 0 };
      }
      budgetMap[catName].actual += Number(obj.Amount);
    });
    
    budgetData = Object.values(budgetMap).sort((a, b) => b.expected - a.expected);
    totalExpectedBudget = budgetData.reduce((sum, item) => sum + Number(item.expected || 0), 0);

    // Process Owner Pie Chart (DevExpress Format: { argument, value })
    const ownerMap = {};
    filteredPayments.forEach(obj => {
      const ownerName = owners.find(x => String(x.ownerId) === String(obj.TransactionBy))?.ownerName || 'Unknown';
      if (!ownerMap[ownerName]) {
        ownerMap[ownerName] = { argument: ownerName, value: 0 };
      }
      ownerMap[ownerName].value += Number(obj.Amount);
    });
    ownerData = Object.values(ownerMap);
  }

  return (
      <div className="dashboard-page">
        <div className="dashboard-filters">
          <div className="filter-controls-container">
            <div className="filter-group">
              <label className="filter-label">View Chart:</label>
              <select 
                className="form-select filter-select view-select" 
                value={selectedChart} 
                onChange={(e) => setSelectedChart(e.target.value)}
              >
                <option value="progress">Budget Progress</option>
                <option value="category">Category Pie Chart</option>
                <option value="owner">Action Taker Pie Chart</option>
                <option value="category_bar">Category Bar Chart</option>
                <option value="owner_bar">Action Taker Bar Chart</option>
              </select>
            </div>

            <div className="filter-group date-filters">
              <label className="year-toggle">
                <input
                  type="checkbox"
                  checked={showFullYear}
                  onChange={(e) => setShowFullYear(e.target.checked)}
                />
                <span>Full year</span>
              </label>
              <input
                type="month"
                className="form-select filter-select month-picker"
                value={selectedMonthPicker}
                onChange={(e) => setSelectedMonthPicker(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className={`glass-panel main-chart-card ${loading ? 'updating' : ''}`} style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
            
            {selectedChart === 'progress' && (
              <>
                <div className="chart-header">
                  <h3 className="chart-title">Budget Progress (Actual vs Expected)</h3>
                  <p className="chart-subtitle budget-summary">
                    <span>Green: Under Budget &nbsp;|&nbsp; Red: Exceeded Budget</span>
                  </p>
                </div>
                <div className="progress-container">
                  {budgetData.length > 0 ? (
                    <>
                      <BudgetProgressBar
                        category="All Expenses"
                        actual={totalExpenses}
                        expected={totalExpectedBudget}
                      />
                      <div className="progress-divider" />
                      {budgetData.map((item, idx) => (
                        <BudgetProgressBar 
                          key={idx}
                          category={item.category}
                          actual={item.actual}
                          expected={item.expected}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="empty-chart">No budget data available for this period.</div>
                  )}
                </div>
              </>
            )}

            {selectedChart === 'category' && (
              <>
                <div className="chart-header">
                  <h3 className="chart-title">Transactions by Category (Pie Chart)</h3>
                </div>
                <div className="chart-container pie-chart-container">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="argument"
                          animationBegin={0}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <RechartsLegend verticalAlign="bottom" wrapperStyle={{ width: '100%', left: 0, bottom: 0 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">No transaction data for this period.</div>
                  )}
                </div>
              </>
            )}

            {selectedChart === 'owner' && (
              <>
                <div className="chart-header">
                  <h3 className="chart-title">Transactions by Action Taker (Pie Chart)</h3>
                </div>
                <div className="chart-container">
                  {ownerData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ownerData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="argument"
                          animationBegin={0}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        >
                          {ownerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <RechartsLegend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">No transaction data for this period.</div>
                  )}
                </div>
              </>
            )}

            {selectedChart === 'category_bar' && (
              <>
                <div className="chart-header">
                  <h3 className="chart-title">Transactions by Category (Bar Chart)</h3>
                </div>
                <div className="chart-container">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{ top: 20, right: 20, left: 8, bottom: 36 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="argument"
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={88}
                          tickMargin={10}
                        />
                        <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}}/>
                        <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} animationDuration={1500}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">No transaction data for this period.</div>
                  )}
                </div>
              </>
            )}

            {selectedChart === 'owner_bar' && (
              <>
                <div className="chart-header">
                  <h3 className="chart-title">Transactions by Action Taker (Bar Chart)</h3>
                </div>
                <div className="chart-container">
                  {ownerData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ownerData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="argument" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}}/>
                        <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} animationDuration={1500}>
                          {ownerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">No transaction data for this period.</div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
  );
};

export default Dashboard;
