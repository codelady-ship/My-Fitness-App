"use client";
import React from "react";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import CardItem from "./Carditem";
import PageHeader from "../../Components/PageHeader";

const Cards = () => {
  const { darkMode, searchTerm, setSearchTerm } = useSidebarStore();
  const { cards, ready } = useDataStore();

  const q = searchTerm.trim().toLowerCase();
  const filteredCards = cards.filter((card) => card.owner.toLowerCase().includes(q) || card.id.toLowerCase().includes(q));

  return (
    <div>
      <PageHeader title="Membership cards">
        <label className="sr-only" htmlFor="card-search">
          Search cards
        </label>
        <input
          id="card-search"
          type="search"
          placeholder="Search by name or card ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 sm:w-72 ${darkMode ? "border-gray-600 bg-gray-800" : "border-amber-300 bg-white"}`}
        />
      </PageHeader>

      <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {filteredCards.map((card) => (
          <CardItem key={card.id} {...card} darkMode={darkMode} />
        ))}
        {ready && filteredCards.length === 0 && (
          <li className="col-span-full text-center text-lg text-gray-500">
            No cards found for &quot;<strong>{searchTerm}</strong>&quot;
          </li>
        )}
      </ul>
    </div>
  );
};

export default Cards;
