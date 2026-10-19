import { ProductEditor } from "@/components/admin/ProductEditor";
import { aiProvider } from "@/lib/ai";

export default function NewProductPage() {
  return <ProductEditor aiEnabled={aiProvider() !== null} />;
}
