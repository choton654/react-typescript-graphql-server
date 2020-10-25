import { User } from "./entity/User";
import { Post } from "./entity/Post";
import { Options } from "@mikro-orm/core";
// import { MikroORM } from "@mikro-orm/core";

const options: Options = {
  entities: [Post, User],
  dbName: "lireddit",
  type: "mongo",
  clientUrl: "mongodb+srv://choton654:9804750147@cluster0-prdkh.mongodb.net",
  debug: process.env.NODE_ENV !== "production",
  ensureIndexes: true,
};

export default options;

// export default {
//   entities: [Post],
//   dbName: "lireddit",
//   type: "mongo",
//   clientUrl: "mongodb+srv://choton654:9804750147@cluster0-prdkh.mongodb.net",
//   debug: process.env.NODE_ENV !== "production",
// } as Parameters<typeof MikroORM.init>[0];
