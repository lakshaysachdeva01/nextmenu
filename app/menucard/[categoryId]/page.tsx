"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Product {
  _id: number;
  title: string | null;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  numbers: { numberOne: number };
  arrays: { arrayOne: string[] };
  featureType?: string;
  logo: string;
  subCategory: { _id: string; name: string };
  superSubCategory: { _id: string; name: string };
}

const API_BASE_URL = "https://api.webbuilder.technolitics.com/api/v1/website-builder";
const WEBSITE_ID = "6667f654a9d9239927ce8743";
const IMAGE_BASE_URL = "https://technolitics-s3-bucket.s3.ap-south-1.amazonaws.com/websitebuilder-s3-bucket/";

async function fetchWebsiteDetails() {
  try {
    const response = await fetch(`https://api.webbuilder.technolitics.com/api/v1/website-builder/website/auth/get-website-by-uid/PRJ00012`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("Website Data:", data); // Debugging
    return data.data || {};
  } catch (error) {
    console.error("Error fetching website details:", error);
    return {};
  }
}

async function fetchProducts(categoryId: string) {
  const response = await fetch(`${API_BASE_URL}/website/product-management/get-all-products/${WEBSITE_ID}?categories=${categoryId}`);
  if (!response.ok) throw new Error("Could not fetch products");
  const data = await response.json();
  return data.data || [];
}

async function fetchSubCategories(categoryId: string) {
  const response = await fetch(`${API_BASE_URL}/website/sub-category/get-all-sub-categories/${WEBSITE_ID}?categories=${categoryId}`);
  if (!response.ok) throw new Error("Could not fetch subcategories");
  const data = await response.json();
  return data.data || [];
}

function getInitials(title: string | null): string {
  if (!title) return "";
  const words = title.split(" ");
  return words.length >= 2 ? (words[0]?.[0] || "").toUpperCase() + (words[1]?.[0] || "").toUpperCase() : (words[0]?.[0] || "").toUpperCase();
}

export default function MenuCard() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<{ _id: string; name: string }[]>([]);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
  const [websiteData, setWebsiteData] = useState<{ basicDetails?: { logo?: string } } | null>(null);

  // Define formData state
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    DOB: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/website/service-enquiry/create-service-enquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteProjectId: WEBSITE_ID, // Include websiteId in the payload
          strings: {
            stringOne: formData.name,
            stringTwo: formData.number,
            stringThree: formData.DOB,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Only set localStorage if the submission is successful
      localStorage.setItem("formSubmitted", "true");
      setShowForm(false); // Hide the form after successful submission
    } catch (error) {
      console.error("Error submitting form:", error);
      // Clear localStorage if submission fails
      localStorage.removeItem("formSubmitted");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Check local storage to see if the form has already been submitted
    const isFormSubmitted = localStorage.getItem("formSubmitted");
    if (!isFormSubmitted || isFormSubmitted !== "true") {
      setShowForm(true); // Show the form if it hasn't been submitted or if submission failed
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      const websiteDetails = await fetchWebsiteDetails();
      setWebsiteData(websiteDetails);
    }
    fetchData();
  }, []);

  const toggleReadMore = (productId: number) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  useEffect(() => {
    if (categoryId) {
      const id = Array.isArray(categoryId) ? categoryId[0] : categoryId; // ✅ Convert array to string
      fetchProducts(id).then(setProducts).catch(console.error);
      fetchSubCategories(id).then(setSubCategories).catch(console.error);
    }
  }, [categoryId]);
  

  const filteredProducts = products.filter((product) =>
    (!showVegOnly || product.featureType === "666a87cda9d9239927d47193") &&
    (!searchTerm || product.title?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedSubCategoryId || product.subCategory?._id === selectedSubCategoryId)
  );

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const group = product.superSubCategory?.name || product.subCategory?.name;
    acc[group] = acc[group] || [];
    acc[group].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsSearchVisible(scrollTop <= lastScrollTop);
      setLastScrollTop(scrollTop);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
        setIsSearchVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container mx-auto bg-white">
       {showForm && (
        <div className="fixed w-full h-full bg-[rgba(0,0,0,0.8)] top-0 left-0 z-50 flex items-center justify-center">
          <form
            id="menuform"
            className="bg-white flex flex-col pt-5 pb-2 px-2 md:py-8 md:px-6 items-center rounded-[18px] relative"
            onSubmit={handleSubmit}
          >
            {websiteData?.basicDetails?.logo && (
              <img className="h-[80px] w-[120px] mb-4" src={`${IMAGE_BASE_URL}${websiteData.basicDetails.logo}`} alt="Logo" />
            )}

            {/* Hidden input for websiteId */}
            <input
              type="hidden"
              id="websiteId"
              name="websiteId"
              value="6667f654a9d9239927ce8743"
            />

            <input
              type="text"
              className="border border-gray-300 m-2 h-[55px] w-[300px] md:w-[350px] p-2 rounded-[8px]"
              placeholder="Full Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
            />
            <input
              type="tel"
              className="border border-gray-300 m-2 h-[55px] w-[300px] md:w-[350px] p-2 rounded-[8px]"
              placeholder="Contact Number"
              name="number"
              required
              value={formData.number}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              minLength={10}
            />
      <input
  type="tel"
  className="border border-gray-300 m-2 h-[55px] w-[300px] md:w-[350px] p-2 rounded-[8px]"
  placeholder="DD-MM-YYYY"
  name="DOB"
  required
  inputMode="numeric"
  maxLength={10}
  value={formData.DOB} // ✅ Keep input controlled
  onChange={(e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters

    if (value.length > 8) value = value.slice(0, 8); // Restrict to 8 digits

    let day = value.slice(0, 2);
    let month = value.slice(2, 4);
    let year = value.slice(4);

    // Ensure valid day (1-31)
    if (parseInt(day) > 31) day = "31";
    if (day === "00") day = "01";

    // Ensure valid month (1-12)
    if (parseInt(month) > 12) month = "12";
    if (month === "00") month = "01";

    // Ensure valid year (up to 2025)
    if (year.length === 4 && parseInt(year) > 2025) year = "2025";

    let formattedValue = day;
    if (month) formattedValue += `-${month}`;
    if (year) formattedValue += `-${year}`;

    setFormData((prev) => ({ ...prev, DOB: formattedValue })); // ✅ Update State
  }}
/>





            <button type="submit" className="bg-green-500 m-2 h-[55px] w-[300px] p-2 rounded-[8px] md:w-[350px] text-white uppercase font-[600]">
              Proceed
            </button>
          </form>
        </div>
      )}

      <div className="relative max-w-[1300px] m-auto">
        <div
          className={`bg-white transition-transform duration-300 ${
            isFixed ? "fixed top-0 left-0 w-full shadow-md z-10" : "relative"
          } ${isFixed && isSearchVisible ? "translate-y-0" : isFixed ? "-translate-y-full" : ""}`}
        >
          <div className="flex justify-center p-2 max-w-[1300px] m-auto">
            <input type="text" placeholder="Search for a dish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-gray-300 rounded-[12px] p-2 mr-2 w-full" />
            <div className="flex flex-col border border-gray-300 rounded-[10px] justify-center items-center p-2 pt-1">
              <span className="text-gray-700 pb-2">Veg</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showVegOnly} onChange={() => setShowVegOnly(!showVegOnly)} className="sr-only peer" />
                <div className="w-12 h-5 bg-gray-300 rounded-full peer-checked:bg-[#118016] relative transition">
                  <img src="/veg.png" className={`absolute bg-white mt-[-4px] ml-[-2px] w-7 h-7 transition-all ${showVegOnly ? "translate-x-[24px]" : "translate-x-0"}`} />
                </div>
              </label>
            </div>
          </div>
          <div className="max-w-[1300px] m-auto text-black font-[600] text-[15px]">
            <div className="flex space-x-4 overflow-x-auto whitespace-nowrap scrollbar-hide justify-around">
              <button className={`px-4 py-2 pb-5  ${!selectedSubCategoryId ? "border-b-2 border-[#ac804c]" : ""}`} onClick={() => setSelectedSubCategoryId(null)}>All</button>
              {subCategories.map((sub) => (
                <button key={sub._id} className={`px-4 py-2 pb-5 !m-0 ${selectedSubCategoryId === sub._id ? "border-b-2 border-[#ac804c]" : ""}`} onClick={() => setSelectedSubCategoryId(sub._id)}>{sub.name}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-[30px] p-4">
          {Object.entries(groupedProducts).map(([group, items]) => (
            <div key={group} className="mb-8">
              <h2 className="text-[20px] font-bold text-black border-b-2 pb-5 border-[#ac804c] mb-4">{group}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {items.map((product, index) => (
                  <div key={product._id || `product-${index}`} className="flex lg:p-4 items-center">
                    {product.arrays.arrayOne[0] ? <img src={`${IMAGE_BASE_URL}${product.arrays.arrayOne[0]}`} alt={product.title || "Dish"} className="min-w-[120px] min-h-[120px] max-h-[120px] max-w-[120px] object-cover rounded-full mr-4" /> : <div className="min-w-[120px] min-h-[120px] max-h-[120px] max-w-[120px] rounded-full bg-[#ffd4b22b] text-[#704828] flex items-center justify-center text-2xl font-semibold mr-4">{getInitials(product.title)}</div>}
                    <div className="flex w-full justify-between items-center w-[100%]">
                      <div className="w-[100%] relative">
                      <h3 className="md:text-xl text-[16px] capitalize text-black mr-[24px] font-semibold">
  {product.title
    ?.toLowerCase() // ✅ Won't run if `product.title` is null
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Untitled"} {/* ✅ Default value */}
</h3>

                        <div className="flex justify-between items-center w-[100%]">
                          <p className="text-[16px] w-[100%] text-[#ac804c]">₹{product.numbers?.numberOne}</p>
                          {product.featureType === "666a87cda9d9239927d47193" ? (
                            <img src="/veg.png" className="h-[21px] w-[20px] absolute top-0 right-0" alt="Veg" />
                          ) : product.featureType === "666a87d5a9d9239927d471d2" ? (
                            <img src="/Non-veg.png" className="h-[21px] w-[20px] absolute top-0 right-0" alt="Non-Veg" />
                          ) : null}
                        </div>
                        {product.description && (
                          <div className="text-[#02060c99] md:text-[1rem] text-[12px] hidden lg:block" dangerouslySetInnerHTML={{ __html: product.description.replace(/<\/?span[^>]*>/g, '') }} />
                        )}
                      {product.description && (
  <div className="text-[#02060c99] md:text-[1rem] text-[12px] block lg:hidden">
    <span style={{ display: "inline" }}>
      <span
        dangerouslySetInnerHTML={{
          __html: expandedProducts[product._id]
            ? product.description.replace(/<\/?(p|span)[^>]*>/g, "")
            : (() => {
                // Remove HTML tags
                const plainText = product.description.replace(/<\/?(p|span)[^>]*>/g, "");
                // Check length before trimming
                if (plainText.length <= 70) {
                  return plainText; // Show full text if it's already 70 or fewer characters
                }
                // Trim by character length and add "..." only if necessary
                return plainText.slice(0, 70) + "...";
              })(),
        }}
      />
      {product.description.replace(/<\/?(p|span)[^>]*>/g, "").length > 70 && (
        <span style={{ display: "inline" }}>
          {" "}
          <button
            onClick={() => toggleReadMore(product._id)}
            className="font-[700] cursor-pointer text-[#02060c99]"
            style={{
              display: "inline",
              whiteSpace: "nowrap",
              border: "none",
              background: "none",
              padding: 0,
            }}
          >
            {expandedProducts[product._id] ? "." : "More"}
          </button>
        </span>
      )}
    </span>
  </div>
)}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}