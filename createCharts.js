/**
 * Creates all charts for the dashboard
 */
function createCharts() {
  try {
    console.log('Creating charts...');
    
    // Create monthly trend charts
    createMonthlyTrendCharts();
    
    // Create YTD achievement chart
    createYTDAchievementChartWrapper();
    
    // Create initiative details charts
    createInitiativeDetailsCharts();
    
    console.log('All charts created successfully');
  } catch (error) {
    console.error('Error creating charts:', error);
    throw new Error(`Failed to create charts: ${error.message}`);
  }
}

/**
 * Creates monthly trend charts for each metric
 */
function createMonthlyTrendCharts() {
  try {
    console.log('Creating monthly trend charts...');
    
    // Create Organic Total Sessions trend chart
    charts.organicTotalSessionsTrend = createMonthlyTrendChart('total-organic-sessions-trend-chart', dashboardData, 'Organic Total Sessions');
    
    // Create Organic Total Users trend chart
    charts.organicTotalUsersTrend = createMonthlyTrendChart('organic-total-users-trend-chart', dashboardData, 'Organic Total Users');
    
    // Create % of users clicking on to further pages trend chart
    charts.usersClickingFurtherTrend = createMonthlyTrendChart('users-clicking-further-trend-chart', dashboardData, '% of users clicking on to further pages');
    
    // Create % of users clicking to partner pages trend chart
    charts.usersClickingPartnerTrend = createMonthlyTrendChart('users-clicking-partner-trend-chart', dashboardData, '% of users clicking to partner pages');
    
    console.log('Monthly trend charts created successfully');
  } catch (error) {
    console.error('Error creating monthly trend charts:', error);
    throw new Error(`Failed to create monthly trend charts: ${error.message}`);
  }
}

/**
 * Creates YTD achievement chart
 */
function createYTDAchievementChartWrapper() {
  try {
    console.log('Creating YTD achievement chart...');
    
    // Create a custom YTD achievement chart with filtered metrics
    charts.ytdAchievement = createFilteredYTDAchievementChart('ytd-achievement-chart', dashboardData, ytdAchievement);
    
    console.log('YTD achievement chart created successfully');
  } catch (error) {
    console.error('Error creating YTD achievement chart:', error);
    throw new Error(`Failed to create YTD achievement chart: ${error.message}`);
  }
}

/**
 * Creates a filtered YTD achievement chart that only includes the relevant metrics
 * @param {string} canvasId - The ID of the canvas element
 * @param {Object} data - The dashboard data
 * @param {Object} ytdAchievement - The YTD achievement data
 * @returns {Object} - The created chart
 */
function createFilteredYTDAchievementChart(canvasId, data, ytdAchievement) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  const datasets = [];
  const latestMonth = 'April'; // Latest month with actual data
  
  console.log('Creating filtered YTD achievement chart with data for month:', latestMonth);
  
  // Define specific colors for each sub-initiative for consistency
  const subInitiativeColors = {
    'Website': CHART_COLORS.blue
  };
  
  // Define the metrics we want to include
  const relevantMetrics = [
    'Organic Total Sessions',
    'Organic Total Users',
    '% of users clicking on to further pages',
    '% of users clicking to partner pages'
  ];
  
  data.subInitiatives.forEach((subInitiative, index) => {
    // Find the initiative that contains this sub-initiative
    const initiative = data.initiatives.find(init => 
      Object.keys(data.structured[init]).includes(subInitiative)
    );
    
    if (initiative) {
      const subInitiativeData = [];
      const metricLabels = [];
      
      console.log(`Processing ${subInitiative} under initiative ${initiative}:`);
      
      // Only include the relevant metrics
      relevantMetrics.forEach(metric => {
        if (data.structured[initiative][subInitiative][metric] && 
            ytdAchievement[initiative][subInitiative][metric][latestMonth]) {
          const achievementValue = ytdAchievement[initiative][subInitiative][metric][latestMonth];
          
          // Cap the achievement value at 150% to avoid extreme values
          const cappedValue = Math.min(achievementValue, 150);
          subInitiativeData.push(cappedValue);
          metricLabels.push(metric);
          
          // Log the actual values for debugging
          const ytdActual = data.structured[initiative][subInitiative][metric].ytdActual[latestMonth];
          const ytdForecast = data.structured[initiative][subInitiative][metric].ytdForecast[latestMonth];
          console.log(`  ${metric}: Achievement = ${achievementValue.toFixed(2)}% (YTD Actual: ${ytdActual}, YTD Forecast: ${ytdForecast})`);
          console.log(`  Capped value: ${cappedValue.toFixed(2)}%`);
        }
      });
      
      // Only add the dataset if there are metrics to display
      if (subInitiativeData.length > 0) {
        // Use the predefined color for this sub-initiative or fall back to a color from the palette
        const color = subInitiativeColors[subInitiative] || Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length];
        
        datasets.push({
          label: subInitiative,
          data: subInitiativeData,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          hoverBackgroundColor: color.replace('1)', '0.8)') // Slightly transparent on hover
        });
      }
    }
  });
  
  // Store the original achievement values for debugging
  const originalAchievementValues = {};
  
  // Create a map of metric to achievement value for debugging
  relevantMetrics.forEach((metric, index) => {
    // Find the initiative that contains this sub-initiative
    const initiative = data.initiatives.find(init => 
      Object.keys(data.structured[init]).includes('Website')
    );
    
    if (initiative && data.structured[initiative]['Website'][metric]) {
      const ytdActual = data.structured[initiative]['Website'][metric].ytdActual[latestMonth] || 0;
      const ytdForecast = data.structured[initiative]['Website'][metric].ytdForecast[latestMonth] || 0;
      
      if (ytdForecast !== 0) {
        const achievementValue = (ytdActual / ytdForecast) * 100;
        originalAchievementValues[metric] = {
          achievement: achievementValue,
          ytdActual: ytdActual,
          ytdForecast: ytdForecast
        };
        console.log(`Original ${metric}: Achievement = ${achievementValue.toFixed(2)}% (YTD Actual: ${ytdActual}, YTD Forecast: ${ytdForecast})`);
      }
    }
  });
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: relevantMetrics,
      datasets: datasets
    },
    options: {
      ...commonChartOptions,
      plugins: {
        ...commonChartOptions.plugins,
        title: {
          display: true,
          text: `YTD Achievement % (as of ${latestMonth} 2025)`,
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          ...commonChartOptions.plugins.tooltip,
          callbacks: {
            ...commonChartOptions.plugins.tooltip.callbacks,
            label: function(context) {
              const label = context.dataset.label || '';
              const metric = relevantMetrics[context.dataIndex];
              
              // Get the original achievement value for this metric
              const originalValue = originalAchievementValues[metric]?.achievement || 0;
              
              // Format the tooltip label
              let tooltipLabel = `${label}: `;
              
              if (originalValue > 150) {
                // If the original value is greater than 150%, show it as "150%+" with the actual value in parentheses
                tooltipLabel += `150%+ (${originalValue.toFixed(1)}%)`;
              } else {
                // Otherwise, show the normal value
                tooltipLabel += `${context.parsed.y.toFixed(1)}%`;
              }
              
              // Add the actual and forecast values
              if (originalAchievementValues[metric]) {
                const { ytdActual, ytdForecast } = originalAchievementValues[metric];
                tooltipLabel += ` (Actual: ${formatNumber(ytdActual)}, Forecast: ${formatNumber(ytdForecast)})`;
              }
              
              return tooltipLabel;
            }
          }
        }
      },
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          min: 0,
          max: 150, // Limit to 150% to avoid extreme values
          grid: {
            ...commonChartOptions.scales.y.grid,
            color: function(context) {
              // Make the 100% line more prominent with a dotted white line
              if (context.tick.value === 100) {
                return 'rgba(255, 255, 255, 0.5)';
              }
              // Return the default grid color for other lines
              return 'rgba(255, 255, 255, 0.05)';
            },
            lineWidth: function(context) {
              // Make the 100% line slightly thicker
              if (context.tick.value === 100) {
                return 2;
              }
              return 1;
            },
            borderDash: function(context) {
              // Make the 100% line dotted
              if (context.tick.value === 100) {
                return [5, 5]; // Dotted line pattern [dash length, gap length]
              }
              return [0, 0]; // Solid line for other grid lines
            }
          },
          ticks: {
            ...commonChartOptions.scales.y.ticks,
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });
  
  console.log('Filtered YTD achievement chart created successfully');
  
  return chart;
}

/**
 * Creates initiative details charts
 */
function createInitiativeDetailsCharts() {
  try {
    console.log('Creating initiative details charts...');
    
    // Find the initiative and sub-initiative for Website
    const initiative = dashboardData.initiatives.find(init => 
      Object.keys(dashboardData.structured[init]).includes('Website')
    );
    
    if (!initiative) {
      console.error('No initiative found for Website');
      return;
    }
    
    // Create Organic Total Sessions chart
    charts.organicTotalSessionsChart = createActualVsForecastChart(
      'initiative-cards-website-total-organic-sessions-chart',
      dashboardData,
      initiative,
      'Website',
      'Organic Total Sessions'
    );
    
    // Create Organic Total Users chart
    charts.organicTotalUsersChart = createActualVsForecastChart(
      'initiative-cards-website-organic-total-users-chart',
      dashboardData,
      initiative,
      'Website',
      'Organic Total Users'
    );
    
    // Create % of users clicking on to further pages chart
    charts.usersClickingFurtherChart = createActualVsForecastChart(
      'initiative-cards-website-users-clicking-further-chart',
      dashboardData,
      initiative,
      'Website',
      '% of users clicking on to further pages'
    );
    
    // Create % of users clicking to partner pages chart
    charts.usersClickingPartnerChart = createActualVsForecastChart(
      'initiative-cards-website-users-clicking-partner-chart',
      dashboardData,
      initiative,
      'Website',
      '% of users clicking to partner pages'
    );
    
    console.log('Initiative details charts created successfully');
  } catch (error) {
    console.error('Error creating initiative details charts:', error);
    throw new Error(`Failed to create initiative details charts: ${error.message}`);
  }
}

/**
 * Add event listeners for interactivity
 */
function addEventListeners() {
  try {
    console.log('Adding event listeners...');
    
    // Add event listeners for tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get the tab to show
        const tabToShow = this.getAttribute('data-tab');
        
        // Hide all tabs and remove active class from buttons
        const tabContainer = this.closest('.tab-container');
        tabContainer.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Show the selected tab and add active class to button
        document.getElementById(tabToShow + '-tab').classList.add('active');
        this.classList.add('active');
        
        // Lazy load charts for the selected tab
        if (tabToShow === 'total-organic-sessions') {
          if (!charts.organicTotalSessionsTrend) {
            charts.organicTotalSessionsTrend = createMonthlyTrendChart('total-organic-sessions-trend-chart', dashboardData, 'Organic Total Sessions');
          }
        } else if (tabToShow === 'organic-total-users') {
          if (!charts.organicTotalUsersTrend) {
            charts.organicTotalUsersTrend = createMonthlyTrendChart('organic-total-users-trend-chart', dashboardData, 'Organic Total Users');
          }
        } else if (tabToShow === 'users-clicking-further') {
          if (!charts.usersClickingFurtherTrend) {
            charts.usersClickingFurtherTrend = createMonthlyTrendChart('users-clicking-further-trend-chart', dashboardData, '% of users clicking on to further pages');
          }
        } else if (tabToShow === 'users-clicking-partner') {
          if (!charts.usersClickingPartnerTrend) {
            charts.usersClickingPartnerTrend = createMonthlyTrendChart('users-clicking-partner-trend-chart', dashboardData, '% of users clicking to partner pages');
          }
        }
      });
    });
    
    // Add event listener for print button
    const printButton = document.getElementById('print-dashboard');
    if (printButton) {
      printButton.addEventListener('click', function() {
        window.print();
      });
    }
    
    console.log('Event listeners added successfully');
  } catch (error) {
    console.error('Error adding event listeners:', error);
    throw new Error(`Failed to add event listeners: ${error.message}`);
  }
}
