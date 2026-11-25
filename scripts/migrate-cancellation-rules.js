import mongoose from "mongoose";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  try {
    const envPath = join(__dirname, "../../.env");
    const envFile = readFileSync(envPath, "utf8");
    const envLines = envFile.split("\n");
    
    for (const line of envLines) {
      const [key, ...valueParts] = line.split("=");
      if (key?.trim() === "MONGODB_URI") {
        MONGODB_URI = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  } catch (error) {
    console.error("Could not read .env file:", error.message);
  }
}

// Import models after mongoose is available
const PropertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

const CANCELLATION_POLICY_KEYS = {
  EASY: "easy",
  BALANCED: "balanced",
  STRICT: "strict",
};

const DEFAULT_CANCELLATION_POLICY = CANCELLATION_POLICY_KEYS.BALANCED;

const createPenalty = (label, minHoursBefore, hostPenaltyPercent) => ({
  label,
  minHoursBefore,
  hostPenaltyPercent,
  guestRefundPercent: 100 - hostPenaltyPercent,
});

const CANCELLATION_POLICIES = {
  [CANCELLATION_POLICY_KEYS.EASY]: {
    key: CANCELLATION_POLICY_KEYS.EASY,
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 30),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 50),
      createPenalty("کمتر از ۳ روز مانده", 0, 70),
    ],
  },
  [CANCELLATION_POLICY_KEYS.BALANCED]: {
    key: CANCELLATION_POLICY_KEYS.BALANCED,
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 40),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 60),
      createPenalty("کمتر از ۳ روز مانده", 0, 80),
    ],
  },
  [CANCELLATION_POLICY_KEYS.STRICT]: {
    key: CANCELLATION_POLICY_KEYS.STRICT,
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 60),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 80),
      createPenalty("کمتر از ۳ روز مانده", 0, 100),
    ],
  },
};

const getPolicyByKey = (key) =>
  CANCELLATION_POLICIES[key] || CANCELLATION_POLICIES[DEFAULT_CANCELLATION_POLICY];

const migrateCancellationRules = async () => {
  try {
    console.log("Connecting to database...");
    console.log("MongoDB URI:", MONGODB_URI ? "Found" : "NOT FOUND");
    
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables or .env file");
    }
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    
    console.log("Connected to database successfully");

    // Find all properties with string cancellationRules
    console.log("Searching for properties with legacy cancellationRules...");
    const properties = await Property.find({
      $or: [
        { cancellationRules: { $type: "string" } },
        { "cancellationRules.penalties": { $exists: false } }
      ]
    }).lean();

    console.log(`Found ${properties.length} properties to migrate`);

    let updated = 0;
    for (const property of properties) {
      const policyKey = property.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
      const policy = getPolicyByKey(policyKey);
      
      const newCancellationRules = {
        penalties: policy.penalties.map((penalty) => ({ ...penalty })),
      };

      await Property.findByIdAndUpdate(property._id, {
        cancellationRules: newCancellationRules
      });
      
      updated++;
      console.log(`Updated property ${property._id} (${updated}/${properties.length})`);
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`Total properties updated: ${updated}`);
    
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrateCancellationRules();
