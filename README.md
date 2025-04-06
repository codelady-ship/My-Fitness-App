This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


      <div className="p-5">
        {stafData.map(({ id, Image, FName, Lname, email, tel, jobType }) => (
          <div key={id} className="flex items-center mb-4 p-4 border-b">
            <Image
              src={Image}
              alt={`${FName} ${Lname}`}
              className="w-12 h-12 rounded-full mr-4"
              width={48} 
              height={48} 
            />
            <div>
              <h3 className="text-lg font-semibold">{FName} {Lname}</h3>
              <p className="text-gray-600">Email: {email}</p>
              <p className="text-gray-600">Phone: {tel}</p>
              <p className="text-gray-600">Job: {jobType}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
 



 settingde istifadecinin programin rengini deismeyin qur
 dil deysme
 detail
 creat staff
 dark/light mode
 side bar icon,baglayb aca bilek
 api qosmaq
 dasbroad
 myfitnes usernamei deyismek
 search
 delete 
 edit button