'use client';
import React from 'react';

const statusColors = {
  active: 'bg-green-200 text-green-800',
  expired: 'bg-red-200 text-red-800',
  passive: 'bg-gray-200 text-gray-800',
};

const CardItem = ({ owner, image, id, remainingAccesses, status,lastVisit, darkMode}: any) => {
  return (
    <div
      className={`rounded-xl shadow-md py-4 px-5 m-5 transition hover:scale-105 cursor-pointer ${
        darkMode ? 'bg-gray-600 text-white' : 'bg-yellow-100 text-black'
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <img src={image} alt={owner} className="w-30 h-30 rounded-full object-cover border-2 border-amber-500" />
        <div>
          <h3 className="text-lg font-bold">{owner}</h3>
          <p className={`text-sm font-bold ${
        darkMode ? 'text-white' : ' text-yellow-800 '
      }`}>ID: {id}</p>
          <p className={`text-sm ${
        darkMode ? 'text-white' : ' text-yellow-800 '
      } font-bold`}>Last Visit: {lastVisit}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}>
          {status === 'active' ? 'Aktiv' : status === 'expired' ? 'finish' : 'Passiv'}
        </span>
        <span className={`text-sm font-semibold ${remainingAccesses <= 2 ? 'text-red-500' : ''}`}>
          Remaining Accesses: <strong>{remainingAccesses}</strong>
        </span>
      </div>
    </div>
  );
};

export default CardItem;
