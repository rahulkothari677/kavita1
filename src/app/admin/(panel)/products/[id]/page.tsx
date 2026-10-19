import { ProductEditor } from "@/components/admin/ProductEditor";
import { aiProvider } from "@/lib/ai";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor key={id} productId={id} aiEnabled={aiProvider() !== null} />;
}
