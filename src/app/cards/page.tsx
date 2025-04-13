'use client';
import React from 'react';
import useSidebarStore from '../../../Store/SidebarStore';
import CardItem from './Carditem'; // Card komponenti
import { cardData } from '../../../Mock/cards'; // Mock data

const Cards = () => {
  const { darkMode,searchTerm, setSearchTerm  } = useSidebarStore();
 
  //search filter
  const filteredCards = cardData.filter((card) =>
    card.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div
        className={`flex flex-col md:flex-row md:justify-between gap-4 ${
          darkMode ? 'bg-black text-white' : 'bg-yellow-50 text-black'
        } p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      >
        <h2 className="text-2xl">Cards</h2>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div
        className={`p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {filteredCards.length > 0 ? (
          filteredCards.map((card, index) => (
            <CardItem key={index} {...card} darkMode={darkMode} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 text-lg font-medium">
            No cards found for "<strong>{searchTerm}</strong>"
          </div>
        )}
      </div>
    </div>
  );
};

export default Cards;
