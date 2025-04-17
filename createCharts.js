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
    
    // Create Total Sessions trend chart
    charts.totalSessionsTrend = createMonthlyTrendChart('total-sessions-trend-chart', dashboardData, 'Total Sessions');
    
    // Create Pageviews trend chart
    charts.pageviewsTrend = createMonthlyTrendChart('pageviews-trend-chart', dashboardData, 'Pageviews');
    
    // Create Avg Session Duration trend chart
    charts.avgSessionDurationTrend = createMonthlyTrendChart('avg-session-duration-trend-chart', dashboardData, 'Avg Session Duration');
    
    // Create Engagement Rate trend chart
    charts.engagementRateTrend = createMonthlyTrendChart('engagement-rate-trend-chart', dashboardData, 'Engagement Rate');
    
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
    
    // Call the actual chart creation function from Website.js
    charts.ytdAchievement = createYTDAchievementChart('ytd-achievement-chart', dashboardData, ytdAchievement);
    
    console.log('YTD achievement chart created successfully');
  } catch (error) {
    console.error('Error creating YTD achievement chart:', error);
    throw new Error(`Failed to create YTD achievement chart: ${error.message}`);
  }
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
    
    // Create Total Sessions chart
    charts.totalSessionsChart = createActualVsForecastChart(
      'initiative-cards-website-total-sessions-chart',
      dashboardData,
      initiative,
      'Website',
      'Total Sessions'
    );
    
    // Create Pageviews chart
    charts.pageviewsChart = createActualVsForecastChart(
      'initiative-cards-website-pageviews-chart',
      dashboardData,
      initiative,
      'Website',
      'Pageviews'
    );
    
    // Create Avg Session Duration chart
    charts.avgSessionDurationChart = createActualVsForecastChart(
      'initiative-cards-website-avg-session-duration-chart',
      dashboardData,
      initiative,
      'Website',
      'Avg Session Duration'
    );
    
    // Create Engagement Rate chart
    charts.engagementRateChart = createActualVsForecastChart(
      'initiative-cards-website-engagement-rate-chart',
      dashboardData,
      initiative,
      'Website',
      'Engagement Rate'
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
        if (tabToShow === 'total-sessions') {
          if (!charts.totalSessionsTrend) {
            charts.totalSessionsTrend = createMonthlyTrendChart('total-sessions-trend-chart', dashboardData, 'Total Sessions');
          }
        } else if (tabToShow === 'pageviews') {
          if (!charts.pageviewsTrend) {
            charts.pageviewsTrend = createMonthlyTrendChart('pageviews-trend-chart', dashboardData, 'Pageviews');
          }
        } else if (tabToShow === 'avg-session-duration') {
          if (!charts.avgSessionDurationTrend) {
            charts.avgSessionDurationTrend = createMonthlyTrendChart('avg-session-duration-trend-chart', dashboardData, 'Avg Session Duration');
          }
        } else if (tabToShow === 'engagement-rate') {
          if (!charts.engagementRateTrend) {
            charts.engagementRateTrend = createMonthlyTrendChart('engagement-rate-trend-chart', dashboardData, 'Engagement Rate');
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
