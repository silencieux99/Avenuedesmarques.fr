"use client";

import { useAllOrders, searchOrders } from "@/lib/firestore/orders/read";
import { useUser } from "@/lib/firestore/user/read";
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  User,
  Input,
} from "@nextui-org/react";
import { EyeIcon, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ListView() {
  const [pageLimit, setPageLimit] = useState(10);
  const [lastSnapDocList, setLastSnapDocList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setLastSnapDocList([]);
  }, [pageLimit]);

  const {
    data: ordersList,
    error,
    isLoading,
    lastSnapDoc,
  } = useAllOrders({
    pageLimit: pageLimit,
    lastSnapDoc:
      lastSnapDocList?.length === 0
        ? null
        : lastSnapDocList[lastSnapDocList?.length - 1],
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchOrders(searchQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center w-full">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div>{error}</div>;
  }

  const displayOrders = searchResults || ordersList;

  return (
    <div className="flex-1 flex flex-col gap-3 md:pr-5 md:px-0 px-5 rounded-xl w-full">
      <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Rechercher (Email, N° Commande, ID)"
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full md:w-80"
            startContent={<Search size={16} />}
            isClearable
            onClear={handleClearSearch}
          />
          <Button color="primary" onClick={handleSearch} isLoading={isSearching}>
            Chercher
          </Button>
        </div>
      </div>

      <Table aria-label="Orders table">
        <TableHeader>
          <TableColumn>N° COMMANDE</TableColumn>
          <TableColumn>CLIENT</TableColumn>
          <TableColumn>TOTAL</TableColumn>
          <TableColumn>PRODUITS</TableColumn>
          <TableColumn>STATUT</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Aucune commande trouvée."}>
          {displayOrders?.map((item) => (
            <TableRow key={item?.id}>
              <TableCell>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {item?.orderNumber || item?.id?.slice(0, 12) + '...'}
                </span>
                <span className="block text-[10px] text-gray-400 mt-1">
                  {item?.timestampCreate
                    ? new Date(item.timestampCreate.seconds * 1000).toLocaleDateString()
                    : item?.createdAt
                      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                      : "Date inconnue"}
                </span>
              </TableCell>
              <TableCell>
                <UserCell uid={item?.uid || item?.userId} order={item} />
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(
                  item?.amountTotal ||
                  item?.checkout?.line_items?.reduce((prev, curr) => {
                    return (
                      prev +
                      (curr?.price_data?.unit_amount / 100) * curr?.quantity
                    );
                  }, 0) || 0
                )}
              </TableCell>
              <TableCell>{(item?.line_items || item?.checkout?.line_items)?.length || 0}</TableCell>
              <TableCell>
                <Chip
                  className="capitalize"
                  color={statusColorMap[item?.status] || statusColorMap[item?.paymentStatus] || "default"}
                  size="sm"
                  variant="flat"
                >
                  {statusTranslation[item?.status] || item?.status || "En attente"}
                </Chip>
              </TableCell>
              <TableCell>
                <Tooltip content="Voir la commande">
                  <Link href={`/admin/orders/${item?.id}`}>
                    <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                      <EyeIcon />
                    </span>
                  </Link>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!searchResults && (
        <div className="flex justify-between items-center px-4">
          <Button
            isDisabled={isLoading || lastSnapDocList?.length === 0}
            onClick={handlePrePage}
            size="sm"
            variant="flat"
          >
            Précédent
          </Button>
          <select
            value={pageLimit}
            onChange={(e) => setPageLimit(e.target.value)}
            className="px-3 py-1 rounded-lg border text-sm"
          >
            <option value={5}>5 par page</option>
            <option value={10}>10 par page</option>
            <option value={20}>20 par page</option>
            <option value={50}>50 par page</option>
          </select>
          <Button
            isDisabled={isLoading || ordersList?.length === 0}
            onClick={handleNextPage}
            size="sm"
            variant="flat"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

function UserCell({ uid, order }) {
  const { data: user } = useUser({ uid });

  // For guest orders, show customer info from order
  if (!uid || uid === 'guest' || order?.isGuest) {
    return (
      <User
        avatarProps={{ radius: "lg", name: order?.customerName?.charAt(0) || "I" }}
        description={order?.customerEmail || "Invité"}
        name={order?.customerName || "Invité"}
      >
        {order?.customerEmail || "Commande invité"}
      </User>
    );
  }

  return (
    <User
      avatarProps={{ radius: "lg", src: user?.photoURL }}
      description={user?.email}
      name={user?.displayName || "Utilisateur"}
    >
      {user?.email}
    </User>
  );
}

const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
  pending: "warning",
  confirmed: "primary",
  processing: "primary",
  shipped: "secondary",
  out_for_delivery: "secondary",
  delivered: "success",
  cancelled: "danger",
  paid: "success",
  failed: "danger",
};

const statusTranslation = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  paid: "Payée",
  failed: "Échouée",
};
