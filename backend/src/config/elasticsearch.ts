import { Client } from "@elastic/elasticsearch";
import env from "./env";

const elasticsearch = new Client({
  node: env.ELASTICSEARCH_URL,
});

export default elasticsearch;