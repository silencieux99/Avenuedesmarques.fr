"use client";

import { useProducts } from "@/lib/firestore/products/read";
import { deleteProduct } from "@/lib/firestore/products/write";
import { useCategories } from "@/lib/firestore/categories/read";
import { useBrands } from "@/lib/firestore/brands/read";
import {
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  Image,
  Input,
  Select,
  SelectItem
} from "@nextui-org/react";
import { Edit2, Trash2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

export default function ListView() {
  const [pageLimit, setPageLimit] = useState(20); // More items by default
  const [lastSnapDocList, setLastSnapDocList] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const router = useRouter();

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  useEffect(() => {
    setLastSnapDocList([]);
  }, [pageLimit]);

  const {
    data: products,
    error,
    isLoading,
    lastSnapDoc,
  } = useProducts({
    pageLimit: pageLimit,
    lastSnapDoc:
      lastSnapDocList?.length === 0
        ? null
        : lastSnapDocList[lastSnapDocList?.length - 1],
  });

  const handleNextPage = () => {
    let newStack = [...lastSnapDocList];
    newStack.push(lastSnapDoc);
    setLastSnapDocList(newStack);
  };

  const handlePrePage = () => {
    let newStack = [...lastSnapDocList];
    newStack.pop();
    setLastSnapDocList(newStack);
  };

  // Client-side Filtering
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // 1. Search Query (Title)
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory && product.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Brand Filter (Assuming brandId is stored, otherwise strictly string match on brand name?)
      // Check data structure: product usually has brandId.
      if (selectedBrand && product.brandId !== selectedBrand) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand]);

  if (isLoading) {
    return (
      <div className="flex justify-center w-full p-10">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-4 md:pr-5 md:px-0 px-5 rounded-xl w-full">

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex-1 w-full md:w-auto flex gap-2 items-center">
          <Input
            placeholder="Rechercher un produit..."
            startContent={<Search size={16} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="max-w-xs"
            size="sm"
            isClearable
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:bg-white transition-colors"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:bg-white transition-colors"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="">Toutes les marques</option>
            {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {(searchQuery || selectedCategory || selectedBrand) && (
            <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("");
              setSelectedBrand("");
            }}>
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      <Table aria-label="Liste des produits">
        <TableHeader>
          <TableColumn>PRODUIT</TableColumn>
          <TableColumn>PRIX</TableColumn>
          <TableColumn>STOCK</TableColumn>
          <TableColumn>COMMANDES</TableColumn>
          <TableColumn>STATUT</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Aucun produit trouvé avec ces filtres."}>
          {filteredProducts.map((item) => (
            <TableRow key={item?.id}>
              <TableCell>
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <Image
                      src={item?.featureImageURL}
                      alt={item?.title}
                      className="h-10 w-10 object-cover rounded-lg bg-gray-100"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm line-clamp-1">{item?.title}</span>
                    <div className="flex gap-1">
                      {item?.isFeatured && (
                        <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">Star</span>
                      )}
                      {/* Display Brand Name if available */}
                      {item?.brandId && (
                        <span className="text-[9px] text-gray-500 bg-gray-50 px-1.5 rounded">{brands?.find(b => b.id === item.brandId)?.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {item?.price ? (
                    <span className="font-semibold text-sm">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item?.price)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs italic">N/A</span>
                  )}
                  {/* Note: salePrice is now deprecated/merged to price, but strictly we display 'price' */}
                </div>
              </TableCell>
              <TableCell>
                <span className={`text-sm ${item?.stock < 5 ? "text-red-500 font-semibold" : ""}`}>{item?.stock}</span>
              </TableCell>
              <TableCell>{item?.orders ?? 0}</TableCell>
              <TableCell>
                <Chip
                  color={item?.stock - (item?.orders ?? 0) > 0 ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                  className="text-xs"
                >
                  {item?.stock - (item?.orders ?? 0) > 0 ? "En Stock" : "Rupture"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Modifier">
                    <span className="p-2 hover:bg-gray-100 rounded-full text-default-500 cursor-pointer active:opacity-50" onClick={() => router.push(`/admin/products/form?id=${item?.id}`)}>
                      <Edit2 size={16} />
                    </span>
                  </Tooltip>
                  <Tooltip color="danger" content="Supprimer">
                    <span className="p-2 hover:bg-red-50 rounded-full text-danger cursor-pointer active:opacity-50" onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
                        deleteProduct({ id: item?.id });
                        toast.success("Produit supprimé");
                      }
                    }}>
                      <Trash2 size={16} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center px-4 py-2 border-t mt-2">
        <Button
          isDisabled={isLoading || lastSnapDocList?.length === 0}
          onClick={handlePrePage}
          size="sm"
          variant="flat"
        >
          Précédent
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden md:inline">Lignes par page :</span>
          <select
            value={pageLimit}
            onChange={(e) => setPageLimit(parseInt(e.target.value))}
            className="px-2 py-1 rounded border text-xs bg-gray-50"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <Button
          isDisabled={isLoading || products?.length === 0}
          onClick={handleNextPage}
          size="sm"
          variant="flat"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
