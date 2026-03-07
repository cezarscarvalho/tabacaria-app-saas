import { getProducts } from "../../services/productsService";

const { data, error } = await getProducts(companyId);