import { Ilinks } from '../../../Interface/links';
import { links } from '../../../Mock/links';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Sidebar = () => {
  return (
    <div className="bg-yellow-50 flex flex-col gap-5 border border-r-amber-700 min-h-[100vh] w-[300px]">
      <div>
        <Image src='/logo1.png' width={150} height={100} alt="Logo"  />
      </div>
      {links.map(({ id, title, to ,icon}: Ilinks) => {
        return (
          <Link href={to} key={id} className="flex items-center gap-3 font-bold text-2xl hover:text-amber-500 p-4 ">
            {React.createElement(icon)}{title}
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;
