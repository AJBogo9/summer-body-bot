(async () => {
    // Use a dynamic import for d3-node.
    const { D3Node } = await import('d3-node');
    const fs = require('fs');
    const mongoose = require('mongoose');
    const config = require('./config');
    const User = require('./models/user-model');
  
    // ----------------------------------------------------------------
    // Function to generate test data that mimics the aggregated data.
    // It returns an array of objects where each object has:
    //  - _id: { guild: <guildName>, date: "YYYY-MM-DD" }
    //  - totalPoints: a random total,
    //  - count: a random count (>=1),
    //  - avgPoints: totalPoints divided by count.
    function generateTestDataForCombinedChart(guilds, startDate, numDays) {
      const data = [];
      const start = new Date(startDate);
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        guilds.forEach(guild => {
          const count = Math.floor(Math.random() * 5) + 1; // 1 to 5
          const totalPoints = Math.floor(Math.random() * 200) + 50; // 50 to 250
          const avgPoints = totalPoints / count;
          data.push({
            _id: { guild, date: dateStr },
            totalPoints,
            count,
            avgPoints
          });
        });
      }
      return data;
    }
  
    // ----------------------------------------------------------------
    // Existing function: Get daily average points per guild for last 7 days from MongoDB.
    async function getDailyAveragePointsByGuild() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const data = await User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              guild: "$guild",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            totalPoints: { $sum: "$points.total" },
            count: { $sum: 1 }
          }
        },
        { $addFields: { avgPoints: { $divide: [ "$totalPoints", "$count" ] } } },
        { $sort: { "_id.date": 1 } }
      ]);
      return data;
    }
  
    // ----------------------------------------------------------------
    // New function: Generate a combined chart that shows the daily average points
    // progression for all guilds on one SVG, with different colored lines and dots.
    // The SVG is sized to exactly fit a landscape A4 page (842 x 595 points) with margins.
    async function generateCombinedGuildAverageChart(data) {
        // Outer dimensions for a landscape A4 page.
        const outerWidth = 1042, outerHeight = 745;
        // Margins: 30 points on each side.
        const margin = { top: 30, right: 30, bottom: 30, left: 30 };
        const availableWidth = outerWidth - margin.left - margin.right; // 842 - 60 = 782
        // Allocate 70% for the chart and 30% for the legend.
        const chartWidth = Math.floor(availableWidth * 0.90);
        const legendWidth = availableWidth - chartWidth;
        const height = outerHeight - margin.top - margin.bottom; // 595 - 60 = 535
      
        const d3n = new D3Node();
        const d3 = d3n.d3;
      
        // Create the outer SVG container.
        const svg = d3n.createSVG(outerWidth, outerHeight);
      
        // Create a group for the chart area (left side).
        const chartG = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
      
        // Group data by guild.
        const guildDataMap = {};
        data.forEach(d => {
          const guild = d._id.guild;
          if (!guildDataMap[guild]) {
            guildDataMap[guild] = [];
          }
          guildDataMap[guild].push(d);
        });
      
        // Parse date strings and sort each guild's data.
        const parseTime = d3.timeParse("%Y-%m-%d");
        for (const guild in guildDataMap) {
          guildDataMap[guild].forEach(d => {
            d.date = parseTime(d._id.date);
            d.avgPoints = +d.avgPoints;
          });
          guildDataMap[guild].sort((a, b) => a.date - b.date);
        }
      
        // Compute global extents for x and y scales.
        let allDates = [], allAvgPoints = [];
        Object.values(guildDataMap).forEach(arr => {
          arr.forEach(d => {
            allDates.push(d.date);
            allAvgPoints.push(d.avgPoints);
          });
        });
      
        const x = d3.scaleTime()
          .domain(d3.extent(allDates))
          .range([0, chartWidth]);
        const y = d3.scaleLinear()
          .domain([0, d3.max(allAvgPoints)])
          .nice()
          .range([height, 0]);
      
        // Add X axis.
        const xAxis = d3.axisBottom(x).ticks(6);
        const gx = chartG.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);
        gx.selectAll("path, line").attr("stroke", "black");
        gx.selectAll("text").attr("fill", "black");
      
        // Add Y axis.
        const yAxis = d3.axisLeft(y);
        const gy = chartG.append("g")
          .call(yAxis);
        gy.selectAll("path, line").attr("stroke", "black");
        gy.selectAll("text").attr("fill", "black");
      
        // Create a color scale.
        const guildNames = Object.keys(guildDataMap);
        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(guildNames);
      
        // Define the line generator.
        const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.avgPoints));
      
        // For each guild, append a line and dots.
        guildNames.forEach(guild => {
          const guildData = guildDataMap[guild];
          chartG.append("path")
            .datum(guildData)
            .attr("fill", "none")
            .attr("stroke", color(guild))
            .attr("stroke-width", 2)
            .attr("d", line);
          chartG.selectAll(`.dot-${guild}`)
            .data(guildData)
            .enter().append("circle")
            .attr("class", `dot-${guild}`)
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.avgPoints))
            .attr("r", 3)
            .attr("fill", color(guild));
        });
      
        // Create a legend on the right side.
        const legendX = margin.left + chartWidth + 20; // 10 points gap from chart area.
        const legendG = svg.append("g")
          .attr("transform", `translate(${legendX},${margin.top})`);
        guildNames.forEach((guild, i) => {
          const legendItemY = i * 25;
          legendG.append("rect")
            .attr("x", 0)
            .attr("y", legendItemY)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(guild));
          legendG.append("text")
            .attr("x", 20)
            .attr("y", legendItemY + 12)
            .text(guild)
            .style("font-size", "12px")
            .attr("fill", "black");
        });
      
        // Add a title for the entire SVG.
        svg.append("text")
          .attr("x", outerWidth / 2)
          .attr("y", margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Daily Average Points Progression for All Guilds (Last 7 Days)");
      
        // Write the SVG to a file.
        const svgString = d3n.svgString();
        fs.writeFileSync("combinedGuildAverages.svg", svgString);
        console.log("Combined guild average chart with legend saved as combinedGuildAverages.svg");
    }               
  
    // ----------------------------------------------------------------
    // Main flow: if "--test" flag is provided, use generated test data.
    if (process.argv.includes('--test')) {
      console.log("Running in test mode with generated test data...");
      const testGuilds = ["TiK", "PT", "FK", "MK"]; // Example guild names.
      const testData = generateTestDataForCombinedChart(testGuilds, "2025-07-01", 7);
      await generateCombinedGuildAverageChart(testData);
    } else {
      // Normal mode: use data aggregated from MongoDB.
      async function generateGuildCharts() {
        const aggregatedData = await getDailyAveragePointsByGuild();
        await generateCombinedGuildAverageChart(aggregatedData);
      }
      try {
        await mongoose.connect(config.mongodbUri);
        console.log("Connected to MongoDB");
        await generateGuildCharts();
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
      } catch (error) {
        console.error("Error generating combined guild average chart:", error);
      }
    }
})();  