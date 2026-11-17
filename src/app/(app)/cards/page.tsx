"use client";
import React from "react";
import useSidebarStore from "@/Store/SidebarStore";
import useDataStore from "@/Store/DataStore";
import CardItem from "./Carditem";
import PageHeader from "@/src/Components/PageHeader";

const Cards = () => {
  const { searchTerm, setSearchTerm } = useSidebarStore();
  const darkMode = false;
  const { cards, ready } = useDataStore();

  const q = searchTerm.trim().toLowerCase();
  const filteredCards = cards.filter((card) => card.owner.toLowerCase().includes(q) || card.id.toLowerCase().includes(q));

  return (
    <div>
      <PageHeader title="Membership cards" />
      <div className="toolbar">
        <label className="sr-only" htmlFor="card-search">
          Search cards
        </label>
        <input
          id="card-search"
          type="search"
          placeholder="Search by name or card ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      <ul className="list-cards">
        {filteredCards.map((card) => (
          <CardItem key={card.id} {...card} darkMode={darkMode} />
        ))}
        {ready && filteredCards.length === 0 && (
          <li className="glass panel col-span-full text-center">
            No cards found for &quot;<strong>{searchTerm}</strong>&quot;
          </li>
        )}
      </ul>
    </div>
  );
};

export default Cards;
