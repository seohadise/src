    import connectDB from "@/config/db";
    import Property from "@/models/Property";
    import Bus from "@/models/Bus";
    import Food from "@/models/Food";
    import Article from "@/models/Article";
    import Reservation from "@/models/Reservation";
    import HomeContent from "@/components/home/home-content";
    import { getPolicyByKey, DEFAULT_CANCELLATION_POLICY } from "@/constants/cancellation-policies";
    import { getUser } from "@/lib/helpers";

    const normalizeCancellationRules = (property) => {
      // If cancellationRules is a string (legacy), convert to structured format
      if (typeof property.cancellationRules === 'string' || !property.cancellationRules?.penalties) {
        const policyKey = property.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
        const policy = getPolicyByKey(policyKey);
        property.cancellationRules = {
          penalties: policy.penalties.map((penalty) => ({ ...penalty })),
        };
      }
      return property;
    };

    const Page = async () => {
      await connectDB();
      const user = await getUser();

      const northernProvinces = ["مازندران", "گیلان", "گلستان"];
      const southernProvinces = ["هرمزگان", "بوشهر", "خوزستان", "سیستان و بلوچستان"];

      const [properties, buses, foods, articles, northernVillas, southernProperties, tehranProperties] = await Promise.all([
        Property.find({ status: "approved" })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("owner", "name"),
        Bus.find({ status: "approved" })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("owner", "name"),
        Food.find({ status: "approved" }).sort({ createdAt: -1 }).limit(8),
        Article.find({ status: "published" })
          .sort({ publishedAt: -1 })
          .limit(8)
          .select("title slug coverImage summary publishedAt views tags createdAt"),
        Property.find({ 
          status: "approved", 
          "address.province": { $in: northernProvinces }
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("owner", "name"),
        Property.find({ 
          status: "approved", 
          "address.province": { $in: southernProvinces }
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("owner", "name"),
        Property.find({ 
          status: "approved", 
          "address.province": "تهران"
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("owner", "name"),
      ]);

      // Get popular destinations based on confirmed reservations
      const popularDestinations = await Reservation.aggregate([
        { $match: { itemType: "property", status: { $in: ["confirmed", "completed"] } } },
        { $lookup: { from: "properties", localField: "itemId", foreignField: "_id", as: "property" } },
        { $unwind: "$property" },
        { $group: { _id: "$property.address.city", province: { $first: "$property.address.province" }, count: { $sum: 1 }, image: { $first: { $arrayElemAt: ["$property.images", 0] } } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, city: "$_id", province: 1, count: 1, image: 1 } }
      ]);

      // Normalize cancellation rules for legacy properties
      const normalizedProperties = properties.map(prop => {
        const plainProp = JSON.parse(JSON.stringify(prop));
        return normalizeCancellationRules(plainProp);
      });

      const normalizedNorthernVillas = northernVillas.map(prop => {
        const plainProp = JSON.parse(JSON.stringify(prop));
        return normalizeCancellationRules(plainProp);
      });

      const normalizedSouthernProperties = southernProperties.map(prop => {
        const plainProp = JSON.parse(JSON.stringify(prop));
        return normalizeCancellationRules(plainProp);
      });

      const normalizedTehranProperties = tehranProperties.map(prop => {
        const plainProp = JSON.parse(JSON.stringify(prop));
        return normalizeCancellationRules(plainProp);
      });

      return (
        <HomeContent
          properties={normalizedProperties}
          buses={JSON.parse(JSON.stringify(buses))}
          foods={JSON.parse(JSON.stringify(foods))}
          articles={JSON.parse(JSON.stringify(articles))}
          popularDestinations={JSON.parse(JSON.stringify(popularDestinations))}
          northernVillas={normalizedNorthernVillas}
          southernProperties={normalizedSouthernProperties}
          tehranProperties={normalizedTehranProperties}
          isLoggedin={user ? true : false}
          userName={user?.fullName}
        />
      );
    };

    export default Page;
