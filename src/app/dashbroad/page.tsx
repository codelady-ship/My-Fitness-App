'use client';
import React from 'react';
import useSidebarStore from '../../../Store/SidebarStore';
import { cardData } from '../../../Mock/cards'; 
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Dashbroad = () => {
  const { darkMode } = useSidebarStore();
  const activeUsers = cardData.filter(user => user.status === "active");
  const activeUserCount = activeUsers.length > 0 ? activeUsers.length : "All users are passive";

  // Calculate the number of new registrations (users registered in the last 30 days)
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30)); // 30 days ago

  const newRegistrations = cardData.filter(user => {
    const userCreatedAt = new Date(user.createdAt); // Assuming the user has a `createdAt` property
    return userCreatedAt >= thirtyDaysAgo;
  }).length;

  // Preparing the chart data dynamically based on cardData
  const chartData = {
    labels: cardData.map((item) => item.owner),  // X-axis labels (user names from cardData)
    datasets: [
      {
        label: 'Recent Activity',  // This is the label for the dataset
        data: cardData.map((item) => item.remainingAccesses),  // Y-axis data (remaining accesses)
        backgroundColor: cardData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`),  // Random colors for each bar
        borderColor: cardData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`),  // Random border colors
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} min-h-screen`}>
      <div 
        className={`border border-b-amber-700  flex justify-between ${darkMode ? 'bg-black' : 'bg-yellow-50'} p-5 border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      >
        <h2 className="text-2xl">Dashboard</h2>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Other widgets */}
        <div 
          className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-100'} flex items-center justify-between`}
        >
          <h3 className="font-semibold text-xl">Total Users</h3>
          <span className="text-2xl font-bold">{cardData.length}</span>
        </div>

        <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-100'} flex items-center justify-between`}>
          <h3 className="font-semibold text-xl">Active Users</h3>
          <span className="text-2xl font-bold">{activeUserCount}</span>
        </div>

        <div 
          className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-100'} flex items-center justify-between`}
        >
          <h3 className="font-semibold text-xl">New Registrations</h3>
          <span className="text-2xl font-bold">{newRegistrations}</span>
        </div>

        {/* Dynamic Chart */}
        <div 
          className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-100'} flex flex-col justify-between col-span-1 lg:col-span-2 mx-auto`}
        >
          <h3 className="font-semibold text-xl text-center ">Recent Activity</h3>
          <div className="lg:w-200 lg:h-100">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'User Activity Over Time',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Users',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Remaining Accesses',
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashbroad;
