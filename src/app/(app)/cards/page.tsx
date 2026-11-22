"use client";
import React from "react";
import { SearchIcon } from "lucide-react";
import useSidebarStore from "@/Store/SidebarStore";
import useDataStore from "@/Store/DataStore";
import CardItem from "./Carditem";
import PageHeader from "@/src/Components/PageHeader";
import { Card } from "@/src/Components/ui/card";
import { Input } from "@/src/Components/ui/input";

const Cards = () => {
  const { searchTerm, setSearchTerm } = useSidebarStore();
  const { cards, ready } = useDataStore();

  const q = searchTerm.trim().toLowerCase();
  const filteredCards = cards.filter((card) => card.owner.toLowerCase().includes(q) || card.id.toLowerCase().includes(q));

  return (
    <div>
      <PageHeader title="Membership cards" />
      <div className="relative mb-4 sm:max-w-sm">
        <label className="sr-only" htmlFor="card-search">
          Search cards
        </label>
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="card-search"
          type="search"
          placeholder="Search by name or card ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
        {filteredCards.map((card) => (
          <CardItem key={card.id} {...card} />
        ))}
        {ready && filteredCards.length === 0 && (
          <li className="col-span-full">
            <Card className="items-center px-6 py-12 text-center text-muted-foreground">
              <p>
                No cards found for &quot;<strong className="text-foreground">{searchTerm}</strong>&quot;
              </p>
            </Card>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Cards;
