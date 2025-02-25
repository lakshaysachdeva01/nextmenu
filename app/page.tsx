// app/index.tsx
import React from 'react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
}

const API_BASE_URL = 'https://api.webbuilder.technolitics.com/api/v1/website-builder';
const WEBSITE_ID = '6667f654a9d9239927ce8743';

async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/website/category/get-all-categories/${WEBSITE_ID}`);
  if (!response.ok) throw new Error("Could not fetch categories");
  const data = await response.json();
  return data.data || [];
}

export default async function Home() {
  const categories: Category[] = await fetchCategories();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link key={category._id} href={`/menucard/${category._id}`} passHref>
            <div className="p-6 bg-yellow-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold">{category.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
