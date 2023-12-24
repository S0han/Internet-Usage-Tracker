document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('myChart');
    const averageTimePerWeekDiv = document.getElementById('average-time-per-week');

    // Get current date and day of the week
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    // Calculate start and end dates of the current week
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - dayOfWeek); // Start of the week (Sunday)

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // End of the week (Saturday)

    // Fetch data from chrome.storage.local
    chrome.storage.local.get(null, function(data) {
        const storedData = data;

        // Initialize arrays to store time spent for each day
        const timeSpentInMinutes = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
        let totalMinutes = 0;

        // Loop through stored data and aggregate time spent for each day of the current week
        Object.keys(storedData).forEach(date => {
            const dataDate = new Date(date);

            // Check if the data date is within the current week
            if (dataDate >= startDate && dataDate <= endDate) {
                const dayIndex = dataDate.getDay(); // Get the day index (0-6) for the stored data
                const formattedTime = storedData[date]; // Get the formatted time for this date from storage

                // Convert time string ('HH:MM:SS') to minutes and add to the corresponding day in the array
                const timeArray = formattedTime.split(':').map(Number);
                const timeInMinutes = timeArray[0] * 60 + timeArray[1] + timeArray[2] / 60;
                timeSpentInMinutes[dayIndex] += timeInMinutes;
                totalMinutes += timeInMinutes;
            }
        });

        // Calculate the average time spent per day for the week
        const daysWithData = timeSpentInMinutes.filter(minutes => minutes > 0).length;
        const averageMinutesPerDay = totalMinutes / daysWithData;

        // Configure the chart with the dynamically obtained data
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Time Spent on YouTube Weekly (Minutes)',
                    data: timeSpentInMinutes,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        // If you want to display labels as minutes (e.g., 60min, 120min, etc.)
                        // ticks: {
                        //     callback: function(value) {
                        //         return value + 'min';
                        //     }
                        // }
                    }
                }
            }
        });

        // Display average time spent per day beneath the chart
        const averageTimeDisplay = document.createElement('div');
        averageTimeDisplay.innerHTML = `Daily Average Time Spent on Youtube: ${averageMinutesPerDay.toFixed(2)} minutes`;
        averageTimePerWeekDiv.appendChild(averageTimeDisplay);
    });
});