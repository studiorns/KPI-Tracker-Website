// Website Dashboard - Chart Configurations and Data Processing
// This file handles data processing and chart creation for the Website KPI Dashboard

console.log('Website.js loaded successfully');

// Constants for chart configuration
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const CHART_COLORS = {
  blue: 'rgba(54, 162, 235, 1)',      // Vibrant blue for Total Sessions
  lightBlue: 'rgba(116, 185, 255, 1)', // Lighter blue
  red: 'rgba(255, 99, 132, 1)',        // Vibrant pink-red
  green: 'rgba(75, 192, 192, 1)',      // Teal/green for Engagement Rate
  purple: 'rgba(153, 102, 255, 1)',    // Vibrant purple for Pageviews
  orange: 'rgba(255, 159, 64, 1)',     // Vibrant orange for Avg Session Duration
  yellow: 'rgba(255, 205, 86, 1)',     // Vibrant yellow
  gray: 'rgba(201, 203, 207, 1)'       // Neutral gray
};

// Constants for frequently used values
const METRICS_CONTAINER_ID = 'metrics-container';
const LATEST_MONTH = 'May'; // Make sure this matches exactly with the month name in the CSV
const TOGGLE_DARK_MODE_ID = 'toggle-dark-mode';

/**
 * Parses CSV data into an array of objects
 * @param {string} csvData - The raw CSV data as a string
 * @returns {Array} - The parsed data as an array of objects
 */
function parseCSVData(csvData) {
  console.log('Raw CSV data first 100 chars:', csvData.substring(0, 100));
  
  // Handle CSV data with quoted fields that may contain commas
  function parseCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue);
    return result;
  }
  
  try {
    const lines = csvData.trim().split('\n');
    console.log(`CSV has ${lines.length} lines`);
    
    if (lines.length <= 1) {
      console.error('CSV data has no data rows');
      return [];
    }
    
    const headers = parseCSVLine(lines[0]).map(header => header.trim());
    console.log('CSV headers:', headers);
    
    // Identify numeric columns (typically columns after the 3rd one, but not Month)
    const numericColumns = headers.slice(4).filter(header => header !== 'Month');
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length === headers.length) {
        const entry = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j].trim().replace(/^"|"$/g, '');
          
          // Special handling for Month column - always keep as string
          if (header === 'Month') {
            entry[header] = value;
            console.log(`Parsed Month: ${value}, type: ${typeof value}`);
          }
          // Special handling for Engagement Rate which is a percentage
          else if (header === 'Actual' || header === 'Forecast' || header === 'YTD Actual Totals' || header === 'YTD Forecast Totals') {
            // Check if the value contains a % sign
            if (value.includes('%')) {
              // Parse as percentage (convert to decimal)
              entry[header] = parsePercentage(value);
            } else {
              // Parse as regular numeric value
              entry[header] = parseNumericValue(value);
            }
          } else {
            entry[header] = value;
          }
        }
        result.push(entry);
      } else {
        console.warn(`Line ${i + 1} has ${values.length} values, expected ${headers.length}`);
      }
    }
    
    console.log(`Successfully parsed ${result.length} rows of data`);
    return result;
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    return [];
  }
}

/**
 * Parses a percentage value from a string
 * @param {string} value - The string value to parse (e.g., "45.2%")
 * @returns {number} - The parsed percentage as a decimal (e.g., 0.452)
 */
function parsePercentage(value) {
  if (!value || value.trim() === '') return 0;
  // Remove the % sign and convert to a decimal
  return parseFloat(value.replace('%', '')) / 100;
}

/**
 * Parses a numeric value from a string, removing commas and quotes
 * @param {string} value - The string value to parse
 * @returns {number} - The parsed numeric value
 */
function parseNumericValue(value) {
  if (!value || value.trim() === '') return 0;
  return parseFloat(value.replace(/[",]/g, '')) || 0;
}

/**
 * Process data for charts
 * @param {Array} data - The parsed CSV data
 * @returns {Object} - The processed data structure
 */
function processData(data) {
  console.log('Processing data...');
  
  // Get unique initiatives, sub-initiatives, and metrics
  const initiatives = [...new Set(data.map(item => item['Initiative Cards']))];
  const subInitiatives = [...new Set(data.map(item => item['Sub Initiative']))];
  const metrics = [...new Set(data.map(item => item['Metric']))];
  
  console.log(`Found ${initiatives.length} initiatives, ${subInitiatives.length} sub-initiatives, and ${metrics.length} metrics`);
  
  // Create structured data for each initiative, sub-initiative, metric combination
  const structuredData = {};
  
  initiatives.forEach(initiative => {
    structuredData[initiative] = {};
    
    subInitiatives.forEach(subInitiative => {
      if (data.some(item => item['Initiative Cards'] === initiative && item['Sub Initiative'] === subInitiative)) {
        structuredData[initiative][subInitiative] = {};
        
        metrics.forEach(metric => {
          const metricData = data.filter(item => 
            item['Initiative Cards'] === initiative && 
            item['Sub Initiative'] === subInitiative && 
            item['Metric'] === metric
          );
          
          if (metricData.length > 0) {
            structuredData[initiative][subInitiative][metric] = {
              actual: {},
              forecast: {},
              ytdActual: {},
              ytdForecast: {}
            };
            
            metricData.forEach(item => {
              const month = item['Month'];
              console.log(`Month from CSV: ${month}, type: ${typeof month}`);
              
              // Make sure month is a valid string
              if (month && typeof month === 'string') {
                structuredData[initiative][subInitiative][metric].actual[month] = item['Actual'];
                structuredData[initiative][subInitiative][metric].forecast[month] = item['Forecast'];
                structuredData[initiative][subInitiative][metric].ytdActual[month] = item['YTD Actual Totals'];
                structuredData[initiative][subInitiative][metric].ytdForecast[month] = item['YTD Forecast Totals'];
              } else {
                console.error(`Invalid month: ${month}`);
              }
            });
            
            // Debug log for months
            const months = Object.keys(structuredData[initiative][subInitiative][metric].actual);
            console.log(`${initiative} - ${subInitiative} - ${metric} has data for months: ${months.join(', ')}`);
          }
        });
      }
    });
  });
  
  return {
    raw: data,
    initiatives,
    subInitiatives,
    metrics,
    structured: structuredData
  };
}

// Calculate Month-over-Month (MoM) changes
function calculateMoMChanges(data) {
  const momChanges = {};
  
  data.initiatives.forEach(initiative => {
    momChanges[initiative] = {};
    
    Object.keys(data.structured[initiative]).forEach(subInitiative => {
      momChanges[initiative][subInitiative] = {};
      
      Object.keys(data.structured[initiative][subInitiative]).forEach(metric => {
        momChanges[initiative][subInitiative][metric] = {};
        
        const months = Object.keys(data.structured[initiative][subInitiative][metric].actual);
        months.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
        
        for (let i = 1; i < months.length; i++) {
          const currentMonth = months[i];
          const previousMonth = months[i-1];
          
          const currentValue = data.structured[initiative][subInitiative][metric].actual[currentMonth];
          const previousValue = data.structured[initiative][subInitiative][metric].actual[previousMonth];
          
          if (previousValue !== 0) {
            const percentChange = ((currentValue - previousValue) / previousValue) * 100;
            momChanges[initiative][subInitiative][metric][currentMonth] = percentChange;
          } else {
            momChanges[initiative][subInitiative][metric][currentMonth] = currentValue > 0 ? 100 : 0;
          }
        }
      });
    });
  });
  
  return momChanges;
}

// Calculate totals across all sub-initiatives
function calculateTotals(data) {
  console.log('Calculating totals across all sub-initiatives...');
  
  const totals = {
    'Organic Total Sessions': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    },
    'Organic Total Users': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    },
    '% of users clicking on to further pages': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    },
    '% of users clicking to partner pages': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    },
    'Avg Session Duration': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    },
    'Engagement Rate': {
      actual: {},
      forecast: {},
      ytdActual: {},
      ytdForecast: {},
      momChange: {}
    }
  };
  
  // Get all months with data
  const allMonths = [];
  data.initiatives.forEach(initiative => {
    Object.keys(data.structured[initiative]).forEach(subInitiative => {
      Object.keys(data.structured[initiative][subInitiative]).forEach(metric => {
        const months = Object.keys(data.structured[initiative][subInitiative][metric].actual);
        months.forEach(month => {
          if (!allMonths.includes(month)) {
            allMonths.push(month);
          }
        });
      });
    });
  });
  
  // Sort months chronologically
  allMonths.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  console.log(`Found ${allMonths.length} months of data: ${allMonths.join(', ')}`);
  
  // Initialize totals for each month and metric
  allMonths.forEach(month => {
    Object.keys(totals).forEach(metric => {
      totals[metric].actual[month] = 0;
      totals[metric].forecast[month] = 0;
      totals[metric].ytdActual[month] = 0;
      totals[metric].ytdForecast[month] = 0;
    });
  });
  
  // Calculate totals for each metric and month
  data.initiatives.forEach(initiative => {
    Object.keys(data.structured[initiative]).forEach(subInitiative => {
      Object.keys(data.structured[initiative][subInitiative]).forEach(metric => {
        if (totals[metric]) {
          allMonths.forEach(month => {
            const actual = data.structured[initiative][subInitiative][metric].actual[month] || 0;
            const forecast = data.structured[initiative][subInitiative][metric].forecast[month] || 0;
            const ytdActual = data.structured[initiative][subInitiative][metric].ytdActual[month] || 0;
            const ytdForecast = data.structured[initiative][subInitiative][metric].ytdForecast[month] || 0;
            
            totals[metric].actual[month] += actual;
            totals[metric].forecast[month] += forecast;
            totals[metric].ytdActual[month] += ytdActual;
            totals[metric].ytdForecast[month] += ytdForecast;
          });
        }
      });
    });
  });
  
  // For Engagement Rate and Avg Session Duration, we need to average the values instead of summing them
  ['Engagement Rate', 'Avg Session Duration'].forEach(metricToAverage => {
    if (totals[metricToAverage]) {
      let metricCount = 0;
      
      data.initiatives.forEach(initiative => {
        Object.keys(data.structured[initiative]).forEach(subInitiative => {
          if (data.structured[initiative][subInitiative][metricToAverage]) {
            metricCount++;
          }
        });
      });
      
      if (metricCount > 0) {
        allMonths.forEach(month => {
          totals[metricToAverage].actual[month] /= metricCount;
          totals[metricToAverage].forecast[month] /= metricCount;
          totals[metricToAverage].ytdActual[month] /= metricCount;
          totals[metricToAverage].ytdForecast[month] /= metricCount;
        });
      }
    }
  });
  
  // Calculate MoM changes for totals
  Object.keys(totals).forEach(metric => {
    allMonths.forEach((month, index) => {
      if (index > 0) {
        const currentValue = totals[metric].actual[month];
        const previousValue = totals[metric].actual[allMonths[index - 1]];
        
        if (previousValue !== 0) {
          const percentChange = ((currentValue - previousValue) / previousValue) * 100;
          totals[metric].momChange[month] = percentChange;
        } else {
          totals[metric].momChange[month] = currentValue > 0 ? 100 : 0;
        }
      } else {
        totals[metric].momChange[month] = 0; // No MoM change for first month
      }
    });
  });
  
  console.log('Totals calculated successfully');
  return totals;
}

// Calculate YTD Achievement percentages
function calculateYTDAchievement(data) {
  const ytdAchievement = {};
  
  data.initiatives.forEach(initiative => {
    ytdAchievement[initiative] = {};
    
    Object.keys(data.structured[initiative]).forEach(subInitiative => {
      ytdAchievement[initiative][subInitiative] = {};
      
      Object.keys(data.structured[initiative][subInitiative]).forEach(metric => {
        ytdAchievement[initiative][subInitiative][metric] = {};
        
        const months = Object.keys(data.structured[initiative][subInitiative][metric].actual);
        months.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
        
        months.forEach(month => {
          const actual = data.structured[initiative][subInitiative][metric].ytdActual[month];
          const forecast = data.structured[initiative][subInitiative][metric].ytdForecast[month];
          
          if (forecast !== 0) {
            const achievement = (actual / forecast) * 100;
            ytdAchievement[initiative][subInitiative][metric][month] = achievement;
          } else {
            ytdAchievement[initiative][subInitiative][metric][month] = 0;
          }
        });
      });
    });
  });
  
  return ytdAchievement;
}

// Format numbers for display
function formatNumber(number, metric) {
  if (number === 0) return '0';
  
  // Handle percentage values (Engagement Rate and other percentage metrics)
  if (metric === 'Engagement Rate' || 
      metric === '% of users clicking on to further pages' || 
      metric === '% of users clicking to partner pages') {
    return (number * 100).toFixed(1) + '%';
  }
  
  // Handle time values (Avg Session Duration)
  if (metric === 'Avg Session Duration') {
    const minutes = Math.floor(number / 60);
    const seconds = Math.floor(number % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Handle large numbers (Total Sessions, Pageviews, Organic Total Sessions, Organic Total Users)
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1) + 'B';
  } else if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  
  return number.toFixed(0);
}

// Common chart options
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        color: '#e2e8f0',
        font: {
          family: "'Inter', sans-serif",
          size: 12
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(26, 32, 44, 0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#e2e8f0',
      borderColor: '#4a5568',
      borderWidth: 1,
      padding: 10,
      boxPadding: 5,
      usePointStyle: true,
      titleFont: {
        family: "'Inter', sans-serif",
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 13
      },
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            // Use the formatNumber function for tooltip values
            const metric = context.chart.options.plugins.tooltip.metric || '';
            if (typeof formatNumber === 'function') {
              label += formatNumber(context.parsed.y, metric);
            } else {
              label += new Intl.NumberFormat().format(context.parsed.y);
            }
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: '#e2e8f0',
        font: {
          family: "'Inter', sans-serif",
          size: 12
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: '#e2e8f0',
        font: {
          family: "'Inter', sans-serif",
          size: 12
        },
        callback: function(value) {
          // This will be overridden for specific charts
          if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + 'B';
          } else if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          }
          return value;
        }
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  elements: {
    line: {
      tension: 0.3
    },
    point: {
      radius: 4,
      hoverRadius: 6
    }
  }
};

// Create actual vs forecast chart with enhanced error handling
function createActualVsForecastChart(canvasId, data, initiative, subInitiative, metric) {
  try {
    console.log(`Creating actual vs forecast chart for ${initiative} - ${subInitiative} - ${metric}...`);
    console.log(`Chart ID: ${canvasId}`);
    
    // Get canvas element
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with ID '${canvasId}' not found`);
      throw new Error(`Canvas element with ID '${canvasId}' not found`);
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Failed to get 2D context for canvas '${canvasId}'`);
      throw new Error(`Failed to get 2D context for canvas '${canvasId}'`);
    }
    
    // Check if data structure exists
    if (!data.structured) {
      console.error('Data structure is missing or invalid');
      displayErrorMessage(ctx, canvas, 'Data structure is missing or invalid');
      return null;
    }
    
    // Check if initiative exists
    if (!data.structured[initiative]) {
      console.error(`Initiative '${initiative}' not found in data structure`);
      console.log('Available initiatives:', Object.keys(data.structured));
      displayErrorMessage(ctx, canvas, `Initiative '${initiative}' not found`);
      return null;
    }
    
    // Check if subInitiative exists
    if (!data.structured[initiative][subInitiative]) {
      console.error(`Sub-initiative '${subInitiative}' not found in initiative '${initiative}'`);
      console.log(`Available sub-initiatives for ${initiative}:`, Object.keys(data.structured[initiative]));
      displayErrorMessage(ctx, canvas, `Sub-initiative '${subInitiative}' not found`);
      return null;
    }
    
    // Check if metric exists
    if (!data.structured[initiative][subInitiative][metric]) {
      console.error(`Metric '${metric}' not found for ${initiative} - ${subInitiative}`);
      console.log(`Available metrics for ${initiative} - ${subInitiative}:`, 
        Object.keys(data.structured[initiative][subInitiative]));
      displayErrorMessage(ctx, canvas, `Metric '${metric}' not found`);
      return null;
    }
    
    const metricData = data.structured[initiative][subInitiative][metric];
    
    // Get all months with data (only Q1 months)
    const allMonths = Object.keys(metricData.actual);
    console.log(`All months in data: ${allMonths.join(', ')}`);
    
    // Filter for January through April months
    const displayMonths = ['January', 'February', 'March', 'April'];
    const months = allMonths.filter(month => displayMonths.includes(month));
    
    if (months.length === 0) {
      console.warn(`No Q1 monthly data found for ${initiative} - ${subInitiative} - ${metric}`);
    }
    
    // Sort months chronologically
    months.sort((a, b) => displayMonths.indexOf(a) - displayMonths.indexOf(b));
    console.log(`Found ${months.length} months of data: ${months.join(', ')}`);
    
    // Extract actual and forecast data
    const actualData = [];
    const forecastData = [];
    
    for (const month of months) {
      const actualValue = metricData.actual[month];
      const forecastValue = metricData.forecast[month];
      
      console.log(`${month} - Actual: ${actualValue}, Forecast: ${forecastValue}`);
      
      actualData.push(actualValue);
      forecastData.push(forecastValue);
    }
    
    console.log(`Actual data: ${actualData.join(', ')}`);
    console.log(`Forecast data: ${forecastData.join(', ')}`);
    
    // Define specific colors for each metric for consistency
    const metricColors = {
      'Total Sessions': CHART_COLORS.blue,
      'Pageviews': CHART_COLORS.purple,
      'Avg Session Duration': CHART_COLORS.orange,
      'Engagement Rate': CHART_COLORS.green
    };
    
    // Use the predefined color for this metric or fall back to a default
    const color = metricColors[metric] || CHART_COLORS.blue;
    
    // Create base chart options based on the metric
    const baseChartOptions = { ...commonChartOptions };
    
    // Set the metric for the tooltip
    baseChartOptions.plugins.tooltip.metric = metric;
    
    // Customize Y-axis based on metric
    if (metric === 'Engagement Rate' || 
        metric === '% of users clicking on to further pages' || 
        metric === '% of users clicking to partner pages') {
      baseChartOptions.scales.y.ticks.callback = function(value) {
        return (value * 100).toFixed(1) + '%';
      };
      baseChartOptions.scales.y.max = 0.4; // 40% (adjust based on data range)
    } else if (metric === 'Avg Session Duration') {
      baseChartOptions.scales.y.ticks.callback = function(value) {
        const minutes = Math.floor(value / 60);
        const seconds = Math.floor(value % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
    } else if (metric === 'Total Sessions' || metric === 'Pageviews' || 
               metric === 'Organic Total Sessions' || metric === 'Organic Total Users') {
      baseChartOptions.scales.y.ticks.callback = function(value) {
        if (value >= 1000000000) {
          return (value / 1000000000).toFixed(1) + 'B';
        } else if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value;
      };
    }
    
    // Debug data before creating chart
    console.log(`Creating chart for ${metric} with data:`, {
      actualData,
      forecastData,
      months
    });

    // Determine appropriate Y-axis scaling based on the data
    let yAxisConfig = {};
    
    if (metric === 'Total Sessions' || metric === 'Pageviews') {
      // For Total Sessions and Pageviews, use a scale appropriate for millions
      const maxValue = Math.max(...actualData, ...forecastData);
      const minValue = Math.min(...actualData, ...forecastData);
      const buffer = (maxValue - minValue) * 0.1; // 10% buffer
      
      yAxisConfig = {
        min: Math.max(0, minValue - buffer),
        max: maxValue + buffer,
        ticks: {
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          callback: function(value) {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(1) + 'B';
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        }
      };
    } else if (metric === 'Avg Session Duration') {
      // For Avg Session Duration, use a scale appropriate for seconds
      const maxValue = Math.max(...actualData, ...forecastData);
      const minValue = Math.min(...actualData, ...forecastData);
      const buffer = (maxValue - minValue) * 0.1; // 10% buffer
      
      yAxisConfig = {
        min: Math.max(0, minValue - buffer),
        max: maxValue + buffer,
        ticks: {
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          callback: function(value) {
            const minutes = Math.floor(value / 60);
            const seconds = Math.floor(value % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }
      };
    } else if (metric === 'Engagement Rate') {
      // For Engagement Rate, use percentage scale (0-100%)
      yAxisConfig = {
        min: 0,
        max: 1,
        ticks: {
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          callback: function(value) {
            return (value * 100).toFixed(0) + '%';
          }
        }
      };
    }

    // Create chart with customized options
    const chartOptions = { 
      ...commonChartOptions,
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          ...yAxisConfig
        }
      },
      plugins: {
        ...commonChartOptions.plugins,
        tooltip: {
          ...commonChartOptions.plugins.tooltip,
          metric: metric
        },
        title: {
          display: true,
          text: `${subInitiative} - ${metric}`,
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // Create chart
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Actual',
            data: actualData,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.1)'),
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          },
          {
            label: 'Forecast',
            data: forecastData,
            borderColor: CHART_COLORS.gray,
            backgroundColor: CHART_COLORS.gray.replace('1)', '0.1)'),
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
            borderDash: [5, 5] // Add dashed line for forecast
          }
        ]
      },
      options: chartOptions
    });
    
    console.log(`Successfully created chart for ${initiative} - ${subInitiative} - ${metric}`);
    return chart;
  } catch (error) {
    console.error(`Error creating chart for ${initiative} - ${subInitiative} - ${metric}:`, error);
    throw error;
  }
}

// Create monthly trend chart
function createMonthlyTrendChart(canvasId, data, metric) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  const months = MONTHS.slice(0, 5); // January through May
  const datasets = [];
  
  // Define specific colors for each sub-initiative for consistency
  const subInitiativeColors = {
    'Website': CHART_COLORS.blue
  };
  
  data.subInitiatives.forEach((subInitiative, index) => {
    const subInitiativeData = [];
    
    // Find the initiative that contains this sub-initiative
    const initiative = data.initiatives.find(init => 
      Object.keys(data.structured[init]).includes(subInitiative)
    );
    
    if (initiative && data.structured[initiative][subInitiative][metric]) {
      months.forEach(month => {
        subInitiativeData.push(data.structured[initiative][subInitiative][metric].actual[month] || 0);
      });
      
      // Use the predefined color for this sub-initiative or fall back to a color from the palette
      const color = subInitiativeColors[subInitiative] || Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length];
      
      datasets.push({
        label: subInitiative,
        data: subInitiativeData,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'), // Add transparency for fill
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true // Enable area fill for better visualization
      });
    }
  });
  
  // Create chart options based on the metric
  const chartOptions = { ...commonChartOptions };
  
  // Set the metric for the tooltip
  chartOptions.plugins.tooltip.metric = metric;
  
  // Customize Y-axis based on metric
  if (metric === 'Engagement Rate') {
    chartOptions.scales.y.ticks.callback = function(value) {
      return (value * 100).toFixed(0) + '%';
    };
    chartOptions.scales.y.max = 1; // 100%
  } else if (metric === 'Avg Session Duration') {
    chartOptions.scales.y.ticks.callback = function(value) {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
  } else if (metric === 'Total Sessions' || metric === 'Pageviews') {
    chartOptions.scales.y.ticks.callback = function(value) {
      if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
      } else if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
      return value;
    };
  }
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        title: {
          display: true,
          text: `Monthly ${metric} Trend - January-May 2025`,
          color: '#e2e8f0',
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  });
  
  return chart;
}

// Create YTD achievement chart
function createYTDAchievementChart(canvasId, data, ytdAchievement) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  const datasets = [];
  const latestMonth = 'May'; // Latest month with actual data
  
  console.log('Creating YTD achievement chart with data for month:', latestMonth);
  
  // Define specific colors for each sub-initiative for consistency
  const subInitiativeColors = {
    'Website': CHART_COLORS.blue
  };
  
  data.subInitiatives.forEach((subInitiative, index) => {
    // Find the initiative that contains this sub-initiative
    const initiative = data.initiatives.find(init => 
      Object.keys(data.structured[init]).includes(subInitiative)
    );
    
    if (initiative) {
      const subInitiativeData = [];
      
      console.log(`Processing ${subInitiative} under initiative ${initiative}:`);
      
      data.metrics.forEach(metric => {
        if (data.structured[initiative][subInitiative][metric] && 
            ytdAchievement[initiative][subInitiative][metric][latestMonth]) {
          const achievementValue = ytdAchievement[initiative][subInitiative][metric][latestMonth];
          subInitiativeData.push(achievementValue);
          
          // Log the actual values for debugging
          const ytdActual = data.structured[initiative][subInitiative][metric].ytdActual[latestMonth];
          const ytdForecast = data.structured[initiative][subInitiative][metric].ytdForecast[latestMonth];
          console.log(`  ${metric}: Achievement = ${achievementValue.toFixed(2)}% (YTD Actual: ${ytdActual}, YTD Forecast: ${ytdForecast})`);
        } else {
          subInitiativeData.push(0);
          console.log(`  ${metric}: No data available`);
        }
      });
      
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
  });
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.metrics,
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
        }
      },
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          min: 0,
          max: 200, // Increased to better visualize values that might be higher
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
  
  console.log('YTD achievement chart created successfully');
  
  return chart;
}

/**
 * Displays an error message on the canvas when chart creation fails
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {string} message - The error message to display
 */
function displayErrorMessage(ctx, canvas, message) {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  ctx.font = '16px "Inter", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw error icon
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 40, 25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 99, 132, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 99, 132, 1)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw X in the circle
  const x = canvas.width / 2;
  const y = canvas.height / 2 - 40;
  const size = 15;
  
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y - size / 2);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.moveTo(x + size / 2, y - size / 2);
  ctx.lineTo(x - size / 2, y + size / 2);
  ctx.strokeStyle = 'rgba(255, 99, 132, 1)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw error message
  ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText('Check console for more details', canvas.width / 2, canvas.height / 2 + 40);
  
  console.error(`Chart error: ${message}`);
}

// Initialize dashboard
let dashboardData, momChanges, ytdAchievement, totalMetrics;
let charts = {};

// Function to initialize the dashboard with CSV data
function initializeDashboard(csvData) {
  console.log('Initializing dashboard with CSV data...');
  
  try {
    // Parse and process the data
    console.log('Parsing CSV data...');
    const parsedData = parseCSVData(csvData);
    console.log(`Parsed ${parsedData.length} rows of data`);
    
    console.log('Processing data...');
    dashboardData = processData(parsedData);
    console.log('Data processed successfully');
    console.log(`Found ${dashboardData.initiatives.length} initiatives, ${dashboardData.subInitiatives.length} sub-initiatives, and ${dashboardData.metrics.length} metrics`);
    
    // Calculate MoM changes and YTD achievement
    console.log('Calculating MoM changes...');
    momChanges = calculateMoMChanges(dashboardData);
    
    console.log('Calculating YTD achievement...');
    ytdAchievement = calculateYTDAchievement(dashboardData);
    
    // Calculate totals across all sub-initiatives
    console.log('Calculating totals across all sub-initiatives...');
    totalMetrics = calculateTotals(dashboardData);
    
    // Create total metric cards
    console.log('Creating total metric cards...');
    const totalMetricsContainer = document.getElementById('total-metrics-container');
    if (!totalMetricsContainer) {
      console.error('Error: total-metrics-container element not found in the DOM');
      console.warn('Will continue without total metrics');
    } else {
      createTotalMetricCards();
    }
    
    // Populate metric cards
    console.log('Populating metric cards...');
    const metricsContainer = document.getElementById('metrics-container');
    if (!metricsContainer) {
      console.error('Error: metrics-container element not found in the DOM');
      throw new Error('metrics-container element not found');
    }
    populateMetricCards();
    
    // Create charts
    console.log('Creating charts...');
    createCharts();
    
    // Add event listeners for interactivity
    console.log('Adding event listeners...');
    addEventListeners();
    
    console.log('Dashboard initialization complete');
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
    
    // Display generic error message in the metrics container
    const metricsContainer = document.getElementById('metrics-container');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div class="metric-card">
          <div class="metric-name"><i class="fas fa-exclamation-triangle"></i> Error</div>
          <div class="metric-value">Failed to initialize dashboard</div>
          <div class="metric-stats">
            <div class="metric-stat">
              <span class="stat-label">Please try again later or contact support.</span>
            </div>
          </div>
        </div>
      `;
    }
    
    throw error;
  }
}

// Export functions for use in the HTML file
window.dashboardFunctions = {
  initializeDashboard,
  formatNumber
};
