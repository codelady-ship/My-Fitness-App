import { Ilinks } from '../../../Interface/links';
import { links } from '../../../Mock/links';
import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="bg-yellow-200 h-[100vh] flex flex-col gap-5 border border-r-amber-700">
      {links.map(({ id, title, to }: Ilinks) => {
        return (
          <Link href={to} key={id}>
            <a className="font-bold text-2xl hover:bg-yellow-300  overflow-auto">{title}</a>
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;
