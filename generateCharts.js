(async () => {
    const { D3Node } = await import('d3-node');
    const fs = require('fs');
    const mongoose = require('mongoose');
    const config = require('./config');
    const User = require('./models/user-model');

    function generateTestDataForCombinedChart(guilds, startDate, numDays) {
      const data = [];
      const start = new Date(startDate);
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        guilds.forEach(guild => {
          const count = Math.floor(Math.random() * 5) + 1;          const totalPoints = Math.floor(Math.random() * 200) + 50;          const avgPoints = totalPoints / count;
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

    async function generateCombinedGuildAverageChart(data) {
        const outerWidth = 1042, outerHeight = 745;

        const margin = { top: 30, right: 30, bottom: 30, left: 30 };
        const availableWidth = outerWidth - margin.left - margin.right;
        const chartWidth = Math.floor(availableWidth * 0.90);
        const legendWidth = availableWidth - chartWidth;
        const height = outerHeight - margin.top - margin.bottom;
        const d3n = new D3Node();
        const d3 = d3n.d3;

        const svg = d3n.createSVG(outerWidth, outerHeight);

        const chartG = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const guildDataMap = {};
        data.forEach(d => {
          const guild = d._id.guild;
          if (!guildDataMap[guild]) {
            guildDataMap[guild] = [];
          }
          guildDataMap[guild].push(d);
        });

        const allGuilds = Object.keys(guildDataMap);
        const topGuilds = allGuilds.sort((a, b) => {
          const totalA = guildDataMap[a].reduce((acc, d) => acc + d.totalPoints, 0);
          const totalB = guildDataMap[b].reduce((acc, d) => acc + d.totalPoints, 0);
          return totalB - totalA;
        }).slice(0, 10);
        for (const guild of allGuilds) {
          if (!topGuilds.includes(guild)) {
            delete guildDataMap[guild];
          }
        }
        const guildNames = topGuilds;

        const parseTime = d3.timeParse("%Y-%m-%d");
        for (const guild in guildDataMap) {
          guildDataMap[guild].forEach(d => {
            d.date = parseTime(d._id.date);
            d.avgPoints = +d.avgPoints;
          });
          guildDataMap[guild].sort((a, b) => a.date - b.date);
        }

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

        const xAxis = d3.axisBottom(x).ticks(6);
        const gx = chartG.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);
        gx.selectAll("path, line").attr("stroke", "black");
        gx.selectAll("text").attr("fill", "black");

        const yAxis = d3.axisLeft(y);
        const gy = chartG.append("g")
          .call(yAxis);
        gy.selectAll("path, line").attr("stroke", "black");
        gy.selectAll("text").attr("fill", "black");

        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(guildNames);

        const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.avgPoints));

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

        const legendX = margin.left + chartWidth + 20;        const legendG = svg.append("g")
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

        svg.append("text")
          .attr("x", outerWidth / 2)
          .attr("y", margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Daily Average Points Progression for All Guilds (Last 7 Days)");

        const svgString = d3n.svgString();
        fs.writeFileSync("combinedGuildAverages.svg", svgString);
        console.log("Combined guild average chart with legend saved as combinedGuildAverages.svg");
    }
    async function generateCombinedGuildTotalPointsChart(data) {
      const outerWidth = 1042, outerHeight = 745;

      const margin = { top: 30, right: 30, bottom: 30, left: 30 };
      const availableWidth = outerWidth - margin.left - margin.right;
      const chartWidth = Math.floor(availableWidth * 0.90);
      const legendWidth = availableWidth - chartWidth;
      const height = outerHeight - margin.top - margin.bottom;

      const d3n = new D3Node();
      const d3 = d3n.d3;

      const svg = d3n.createSVG(outerWidth, outerHeight);

      const chartG = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const guildDataMap = {};
      data.forEach(d => {
        const guild = d._id.guild;
        if (!guildDataMap[guild]) {
          guildDataMap[guild] = [];
        }
        guildDataMap[guild].push(d);
      });

      const allGuilds = Object.keys(guildDataMap);
      const topGuilds = allGuilds.sort((a, b) => {
        const totalA = guildDataMap[a].reduce((acc, d) => acc + d.totalPoints, 0);
        const totalB = guildDataMap[b].reduce((acc, d) => acc + d.totalPoints, 0);
        return totalB - totalA;
      }).slice(0, 10);

      for (const guild of allGuilds) {
        if (!topGuilds.includes(guild)) {
          delete guildDataMap[guild];
        }
      }
      const guildNames = topGuilds;

      const parseTime = d3.timeParse("%Y-%m-%d");
      for (const guild in guildDataMap) {
        guildDataMap[guild].forEach(d => {
          d.date = parseTime(d._id.date);
          d.totalPoints = +d.totalPoints;
        });
        guildDataMap[guild].sort((a, b) => a.date - b.date);
      }

      let allDates = [], allTotalPoints = [];
      Object.values(guildDataMap).forEach(arr => {
        arr.forEach(d => {
          allDates.push(d.date);
          allTotalPoints.push(d.totalPoints);
        });
      });

      const x = d3.scaleTime()
        .domain(d3.extent(allDates))
        .range([0, chartWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(allTotalPoints)])
        .nice()
        .range([height, 0]);

      const xAxis = d3.axisBottom(x).ticks(6);
      const gx = chartG.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
      gx.selectAll("path, line").attr("stroke", "black");
      gx.selectAll("text").attr("fill", "black");

      const yAxis = d3.axisLeft(y);
      const gy = chartG.append("g")
        .call(yAxis);
      gy.selectAll("path, line").attr("stroke", "black");
      gy.selectAll("text").attr("fill", "black");

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(guildNames);

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.totalPoints));

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
          .attr("cy", d => y(d.totalPoints))
          .attr("r", 3)
          .attr("fill", color(guild));
      });

      const legendX = margin.left + chartWidth + 20;
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

      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Daily Total Points Progression for All Guilds (Last 7 Days)");

      const svgString = d3n.svgString();
      fs.writeFileSync("combinedGuildTotalPoints.svg", svgString);
      console.log("Combined guild total points chart saved as combinedGuildTotalPoints.svg");
    }

    if (process.argv.includes('--test')) {
      console.log("Running in test mode with generated test data...");
      const testGuilds = ["TiK", "PT", "FK", "MK"];
      const testData = generateTestDataForCombinedChart(testGuilds, "2025-07-01", 7);
      await generateCombinedGuildTotalPointsChart(testData);
    } else {
      async function generateGuildCharts() {
        const aggregatedData = await getDailyAveragePointsByGuild();
        await generateCombinedGuildTotalPointsChart(aggregatedData);
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
