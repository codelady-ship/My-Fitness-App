'use client';
import React, { useState } from 'react';
import useSidebarStore from '../../../Store/SidebarStore'; 
import { cardData as initialCardData } from '../../../Mock/cards'; // Başlanğıc data
import { showEditUserModal } from './Modals/userEditModal'; 
import { showDeleteUserModal } from './Modals/userDeleteModal'; 
import { showAddUserModal } from './Modals/addUserModal';
import { showUserCardModal } from './Modals/userCardClick';

const Users = () => {
  const { darkMode } = useSidebarStore();

  const [cards, setCards] = useState(initialCardData);
  const [searchTerm, setSearchTerm] = useState(""); // Axtarış termi üçün state

  // Filtrələmə (axtarış funksiyası)
  const filteredCards = cards.filter(card => {
    // Axtarış `owner`, `email`, `phone`, `status`, `goals`, `coach` və digər sahələr üzrə ediləcək
    return (
      card.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.goals.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.coach.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEdit = (card: any) => {
    showEditUserModal(card, setCards, cards, darkMode);
  };

  const handleDelete = (id: string) => {
    showDeleteUserModal(id, setCards, cards, darkMode);
  };

  const handleAddCard = () => {
    showAddUserModal(setCards, cards, darkMode);
  };

  const handleCardClick = (card: any) => {
    showUserCardModal(card, setCards, cards, darkMode);
  };

  return (
    <div className={`p-5 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className={`flex flex-col sm:flex-row justify-between ${darkMode ? 'bg-black' : 'bg-yellow-50'} p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}>
        <h2 className="text-2xl sm:mt-0">Users</h2>
        <input 
        type="text" 
        id="search" 
        className="swal2-input rounded-2xl py-1 px-2 border border-amber-800 text-center w-full sm:w-1/3 mt-4 sm:mt-0" 
        placeholder="Search all info" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Axtarış inputu dəyişdikcə state-i yenilə
        />
       <button
         onClick={handleAddCard}
         className="bg-yellow-500 text-white py-1 px-2 rounded-lg mb-4 sm:mb-0 sm:ml-4 mt-4 sm:mt-0 sm:w-auto w-full"
        >
         +Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-5">
        {filteredCards.length > 0 ? (
          filteredCards.map((card) => (
            <div
              key={card.id}
              className="flex justify-between font-bold p-4 border rounded-lg shadow-lg cursor-pointer"
              onClick={() => handleCardClick(card)}
            >
              <img
                src={card.image}
                alt={card.owner}
                className="w-40 h-40 object-cover mb-2"
              />
              <div className="text-start ml-4">
                <h3 className="font-bold text-2xl">{card.owner}</h3>
                <p>Status: {card.status}</p>
                <p>Last Used: {card.lastUsed}</p>
                <p>Goals: {card.goals}</p>
                <p>Coach: {card.coach}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No users found</p> // Axtarış olmasa bu mesaj göstərilsin
        )}
      </div>
    </div>
  );
};

export default Users;
