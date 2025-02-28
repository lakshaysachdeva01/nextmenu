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
  const [showNonVegOnly, setShowNonVegOnly] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
  const [websiteData, setWebsiteData] = useState<{ basicDetails?: { logo?: string } } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Define formData state
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    DOB: "",
    email: "",
    gender: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {  // Ensure it's running on the client-side
      const isFormSubmitted = localStorage.getItem("formSubmitted");
  
      if (isFormSubmitted === "true") {
        setShowForm(false);  // Hide form if already submitted
      } else {
        setShowForm(true);  // Show form if not submitted
      }
    }
  }, []);
  
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
            email : formData.email,
            stringFour: formData.gender,
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
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  

 

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
  
  const getProductCount = (id: string | null) => {
    if (!id) return products?.length || 0; // If id is null, return total products count
    return products?.filter((item) => item?.subCategory?._id === id).length || 0;
  };
  

  const handleCategoryClick = (id: string | null) => {
    setSelectedSubCategoryId(id);
    setIsOpen(false); // Close menu after clicking a subcategory
  };

  const filteredProducts = products.filter((product) =>
    (!showVegOnly || product.featureType === "666a87cda9d9239927d47193") &&
    (!searchTerm || product.title?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!showNonVegOnly || product.featureType != "666a87cda9d9239927d47193") &&
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
    if (showForm) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = ""; // Restore scrolling
    }
  
    return () => {
      document.body.style.overflow = ""; // Cleanup when component unmounts
    };
  }, [showForm]);
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
    <div className="container mx-auto bg-white ">
       {showForm && (
        <div className="fixed w-full h-full bg-[rgba(0,0,0,0.8)] top-0 left-0 z-50 flex items-center justify-center ">
          <form
  id="menuform"
  className="flex h-[100%] w-[100%] flex-col  md:py-8 md:px-6  items-center  relative overflow-y-auto p-2 "
  onSubmit={handleSubmit}
>
<div className="w-full h-[84%] flex flex-col items-center justify-center m-3 py-8 rounded-[20px] bg-white">
<div className="h-full flex justify-center items-center bg-white ">
            {websiteData?.basicDetails?.logo && (
              <img className="h-[80px] w-[120px]  " src={`${IMAGE_BASE_URL}${websiteData.basicDetails.logo}`} alt="Logo" />
            )}</div>

            {/* Hidden input for websiteId */}
            <input
              type="hidden"
              id="websiteId"
              name="websiteId"
              value="6667f654a9d9239927ce8743"
            />

<div className="relative my-2 px-4  w-full  md:w-[400px]">
  {/* Floating Label */}
  <label
    className={`absolute  left-7 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all  duration-200 pointer-events-none
      ${formData.name ? "text-sm top-[-2] text-[10px] text-gray-600 bg-white px-1 " : "text-base top-1/2"}
    `}
  >
    Full Name
  </label>

  {/* Input Field */}
  <input
    type="text"
    name="name"
    value={formData.name}
    onChange={handleChange}
    required
    className=" border border-gray-300 h-[50px] w-full p-2 pt-2 max-h-[50px] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-gray-400"
  />
</div>
<div className="relative my-2 px-4 w-full md:w-[400px]">
  {/* Floating Label for Contact Number */}
  <label
    className={`absolute  left-7 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none
      ${!!formData.number ? "text-sm top-[-2px] text-[10px] text-gray-600 bg-white px-1" : "text-base top-1/2"}
    `}
  >
    Contact Number
  </label>

  {/* Contact Number Input */}
  <input
    type="tel"
    name="number"
    required
    value={formData.number}
    onChange={handleChange}
    inputMode="numeric"
    maxLength={10}
    minLength={10}
    className="border border-gray-300 h-[50px] w-full p-2 pt-2 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-gray-400"
  />
</div>


<div className="relative my-2 px-4  w-full  md:w-[400px]">
  {/* Floating Label */}
  <label
    className={`absolute  left-7 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all  duration-200 pointer-events-none
      ${formData.email ? "text-sm top-[-2px] text-gray-600 text-[10px] bg-white px-1 " : "text-base top-1/2"}
    `}
  >
    Email
  </label>

  {/* Input Field */}
  <input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    required
    className="border border-gray-300 h-[55px] w-full p-2 pt-2 max-h-[50px] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-gray-400"
  />
</div>


<div className="relative my-2 px-4  w-full  md:w-[400px]">
  {/* Floating Label for DOB */}
  <label
    className={`absolute  left-7 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none
      ${formData.DOB ? "text-sm top-[-2px] text-[10px] text-gray-600 bg-white px-1" : "text-base top-1/2"}
    `}
  >
    Date of Birth (DD-MM-YYYY)
  </label>

  {/* Date of Birth Input */}
  <input
    type="tel"
    name="DOB"
    required
    inputMode="numeric"
    maxLength={10}
    value={formData.DOB}
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
    className="border border-gray-300 h-[50px] w-full p-2 pt-2 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-gray-400"
  />
</div>

<div className="relative my-2 px-4  w-full  md:w-[400px]">
  {/* Floating Label for Gender */}
  <label
    className={`absolute  left-7 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none
      ${formData.gender ? "text-sm top-[-2px] text-[10px] text-gray-600 bg-white px-1" : "text-base top-1/2"}
    `}
  >
    Gender
  </label>

  {/* Select Dropdown for Gender */}
  <select
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    required
    className="border border-gray-300 h-[50px] w-full p-2 rounded-[8px] appearance-none focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
  >
    <option value="" hidden></option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
    <option value="prefer_not_to_disclose">Prefer not to disclose</option>
  </select>
</div>
</div>



<div className="absolute bottom-0 rounded-t-[20px] bg-white w-full h-[13%] p-4 pb-6  flex items-start md:max-w-[400px]"  >
            <button type="submit" className="bg-red-900  h-[50px] w-full  p-2 rounded-[8px] md:w-[400px] text-white uppercase font-[600]">
              Proceed
            </button></div>
          </form>
        </div>
      )}

      <div className="relative max-w-[1300px] m-auto">

      {isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsOpen(false)} />
)}

<div className="fixed right-[5%] bottom-[7%] z-20">
  {/* Menu Button */}
  <button
    className="bg-black p-9 w-[50px] h-[50px] rounded-full flex justify-center items-center text-white flex-col relative"
    onClick={() => setIsOpen(!isOpen)} // Toggle the menu
  >
    <i className="fa-solid fa-utensils"></i>
    Menu
  </button>

  {isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsOpen(false)} />
)}

<div className="fixed right-[5%] bottom-[8%] z-20">
  {/* Menu Button */}
  
  {/* Bottom Div (Overlaps Button, Doesn't Move It) */}
  {isOpen && (
   <div
   className="custom-scrollbar absolute bottom-0 text-gray-600 right-0 bg-white px-6 py-4 rounded-xl shadow-lg w-[250px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
   
 >
   <h3 className="text-[16px] text-green-500 font-[700] pb-3 ">Get menu by categories</h3>
   <div className="flex flex-col">
     <button
       className="py-[10px] flex font-[400] font-[550] text-[14px] justify-between"
       onClick={() => handleCategoryClick(null)}
     >
       All <span className="text-gray-500">{products.length}</span>
     </button>
 
     {subCategories?.length > 0 &&
       subCategories
         .filter((sub) => sub && sub._id) // Remove null values
         .map((sub) => (
           <button
             key={sub._id}
             className="py-[10px] flex font-[550] text-[14px] capitalize justify-between"
             onClick={() => handleCategoryClick(sub._id)}
           >
             {sub.name
               ? sub.name.charAt(0).toUpperCase() + sub.name.slice(1).toLowerCase()
               : "Unnamed"}
             <span className="text-gray-500">{getProductCount(sub._id) || 0}</span>
           </button>
         ))}
   </div>
 </div>
 
  
  )}
</div>

{/* ✅ Close Button Placed Outside */}
{isOpen && (
  <button
    className="fixed bottom-[2%] right-[5%] bg-black text-white py-2 px-5 rounded-md font-semibold hover:bg-red-600 transition z-30"
    onClick={() => setIsOpen(false)}
  >
   &times; Close
  </button>
)}

</div>


        <div
          className={`bg-white transition-transform md:pt-8 duration-300 ${
            isFixed ? "fixed top-0 left-0 w-full shadow-md z-10" : "relative"
          } ${isFixed && isSearchVisible ? "translate-y-0" : isFixed ? "-translate-y-full" : ""}`}
        >
          <div className="flex flex-col justify-center p-2 max-w-[1300px] m-auto">
            <input type="text" placeholder="Search for a dish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-100 rounded-[10px] p-2 mr-2 w-full" />
          <div className="flex mt-3 gap-[6px]">  
            
            <div className="flex flex-col border border-gray-300 rounded-[20px] justify-center items-center px-4 py-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showVegOnly} onChange={() => setShowVegOnly(!showVegOnly)} className="sr-only peer" />
                <div className="w-10 xl:w-12 h-[10px] lg:h-3 bg-gray-300 rounded-full peer-checked:bg-[#118016] relative transition">
                  <img src="/veg.png" className={`absolute bg-white mt-[-3px] xl:mt-[-5px] ml-[-2px] xl:w-5 xl:h-5 w-4 h-4 transition-all ${showVegOnly ? "translate-x-[26px] xl:translate-x-[32px] " : "translate-x-0"}`} />
                </div>
              </label>
            </div>

            <div className="flex flex-col border border-gray-300 rounded-[20px] justify-center items-center px-4 py-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showNonVegOnly} onChange={() => setShowNonVegOnly(!showNonVegOnly)} className="sr-only peer" />
                <div className="w-10 xl:w-12 h-[10px] lg:h-3 bg-gray-300 rounded-full peer-checked:bg-red-800 relative transition">
                  <img src="/Non-veg.png" className={`absolute bg-white mt-[-3px] xl:mt-[-5px] ml-[-2px] xl:w-5 xl:h-5 w-4 h-4 transition-all ${showNonVegOnly ? "translate-x-[26px] xl:translate-x-[32px] " : "translate-x-0"}`} />
                </div>
              </label>
            </div>
            
            
            </div>
          </div>
          {/* <div className="max-w-[1300px] m-auto text-black font-[600] text-[15px]">
            <div className="flex space-x-4 overflow-x-auto whitespace-nowrap scrollbar-hide justify-around">
              <button className={`px-4 py-2 pb-5  ${!selectedSubCategoryId ? "border-b-2 border-[#ac804c]" : ""}`} onClick={() => setSelectedSubCategoryId(null)}>All</button>
              {subCategories.map((sub) => (
                <button key={sub._id} className={`px-4 py-2 pb-5 !m-0 ${selectedSubCategoryId === sub._id ? "border-b-2 border-[#ac804c]" : ""}`} onClick={() => setSelectedSubCategoryId(sub._id)}>{sub.name}</button>
              ))}
            </div>
          </div> */}
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