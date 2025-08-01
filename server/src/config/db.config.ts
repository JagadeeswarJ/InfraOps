import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = {
  projectId: "bitnap-0",
  privateKeyId: "ddd67d8a746d879be82acc57ea93924fc3cb7d87",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwrHnYFWSo3nEH\nLTPWz3wkt6jxLc3PzCK63TAyLx15rJNx6KP8Ji+zwB5cahBpAw6q2ppFzxMnrlKR\nYXIocze1UAh9PrFrE278JTTOsb9TRbkeJyvHGdAKuBO7YTV0DaQfReI1xTZH8bTU\nYuYVmT9s1WyTIS9GiAGACW0pvGsJmRTRQyMy4nFIPSu1EsOOdFdPzG2kbIPdDAOI\n+yIfQo9sbBEMpxI0ZW/wKQIjh8IjOv00RZpQrL+zbT/6TsZCCi2CJ8M2Bf6JvOsy\n1W7Knm9sDW32ZCJpdgDG7aCWSD+GPh2ebT28ko7HUvAv9kLQOJLeCd9QKl9nYjf3\nDx5+wEBNAgMBAAECggEACHzzQ9xJQ2sgFPQJKTRuo2jDs0ZCVlqy8dvfhvW1B18k\nQvHmP2tjpmtTRuWqOqvBlP6FY9e36AblY1c1b+r5l1qZDp1huQ8ZHLOgtrjnxCIv\nXrSLYAvMYnHaftaD7GEdMr4KiQ9O+5D9B8KY1jS2s6DWw2qlFd3CBrFm2LCIMV26\nCd7QftO/nGnN4h03UTNwXI2Z/HyWosIqhFKar8D2kd5mn47vsrJbh5cx0MfDBN3y\n6hbSHUIRjrXN71uVTYE79DlQs2FT9HnbEL3XY8w62M0xIvlei7lRlWnkjs8D6Huj\nGGg0Y/4sg6K8I8htyQl7uEv1VMUSDOKOaZ9wTHv+UQKBgQDebZRX7pmzcexZAb1f\nxd0XN4j+lJJhrPxkDp72lh410z+LknOxwXZbpIU8qXl2DFhhQPo2vwpkMbbYLeqQ\n1h+nkP6hhw+yBFS/EBZs7Dfa912IYs9fKVU1bKYVqOdlZvFVRPtSQZvvxBN1QhIB\nWwWF6zORc5g5QGwb5nPuEhfLXQKBgQDLVv2qmWT2n5vOe77fNwKdwzKD45qkEXMd\nCrHIfFH9C+8NOAWfPOX6qQY6D8Wq9RoFFAuToTrWzID0xpKWjJGydr0Xh2OHZchY\nJ4B8SkQaY/nP1IsGXCT/R4IUj0lesJA25Efn5R4eTnzGEtv+YEc4wdYo24i8gzed\n9HI79rnpsQKBgQCdc4RnGofC9woPl6OugCoZnT5kuFdGvWWMjq0IcQvBnmCFNI6h\nbgmSpcuLPYy1e9e0QILe7i0079w2+4noLSsLOyCEx07c/SPgfErjn/OKFUEooomZ\nG3Et+FM5Ue87YLvFWKdvevIfr/T2NGb6fqxSOESw2dsP7AKbXW8DP9uIIQKBgQCf\nub2Y/NWqRMYG9H2CqZuMgYB0yZz3tB1Qes4cRkvBEla9c3w3EYc11v/lK+6B0/aU\ndqKBXOzzPcEuha0wRUtNfKgci2VLPlCZrq3m9A97C314G+T5IfiN7oXn0IY5s0gV\nVkyFhBycgdrRXI8iyk4n71tizNAkBI7zrMjvAWgYgQKBgAoM3VrKWB8fEh2H3xdk\nH16btX+iDL4+/Lq6Xdq5CFdk+S303LCSKXIHo+xsRfhI/X5Z6Qc02XbpKfJiTgg1\n0KA8ErAmCqjVzpAwDh38+a4qka3y1EtFEggkdNz+1/HILjzcnet3dIA8V5z9kdtr\nouPS6z/BqQaw0UTi884EBmeL\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-fbsvc@bitnap-0.iam.gserviceaccount.com",
  clientId: "105604654305089292882",
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });

export const db = firestore;
export const auth = getAuth();