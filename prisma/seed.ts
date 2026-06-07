import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const chittagongCityAreas = [
  "Kotwali",
  "Chawkbazar",
  "Bakalia",
  "Pahartali",
  "Halishahar",
  "Patenga",
  "Double Mooring",
  "Panchlaish",
  "Bayazid Bostami",
  "Khulshi",
  "Chandgaon",
  "EPZ",
  "Agrabad",
  "South Agrabad",
  "North Agrabad",
  "Sadarghat",
  "Anderkilla",
  "Patharghata",
  "Lalkhan Bazar",
  "Nasirabad",
  "Mehedibagh",
  "Sholoshahar",
  "Firozshah",
  "Muradpur",
  "Shulakbahar",
  "Mohra",
  "East Bakalia",
  "West Bakalia",
  "North Kattali",
  "South Kattali",
  "Agrabad Access Road",
  "North Halishahar",
  "South Halishahar",
  "Patenga Sea Side",
  "East Bakalia Extension",
  "West Bakalia Extension",
  "Middle Halishahar",
  "North Chandgaon",
  "South Chandgaon",
  "Western Bayazid",
  "Eastern Bayazid"
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kiddiq.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminKiddiq2026';
  
  console.log(`👤 Bootstrapping Admin account: ${adminEmail}`);
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Kiddiq Admin',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('✅ Admin account seeded successfully.');
  } else {
    console.log('ℹ️ Admin account already exists. Skipping user seed.');
  }

  // 2. Seed Flat Categories
  console.log('📂 Seeding flat categories...');
  const categoriesData = [
    { name: 'Educational Toys', slug: 'educational-toys', image: '/images/categories/educational-toys.jpg' },
    { name: 'School Supplies', slug: 'school-supplies', image: '/images/categories/school-supplies.jpg' },
    { name: 'Parenting Resources', slug: 'parenting-resources', image: '/images/categories/parenting-resources.jpg' },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: cat,
    });
    categoriesMap[cat.name] = upserted.id;
    console.log(`   - Seeded category: ${cat.name}`);
  }

  // 3. Seed Delivery Zones & Areas
  console.log('🚚 Seeding delivery zones & areas...');
  
  const ctZone = await prisma.deliveryZone.upsert({
    where: { name: 'Chattogram City' },
    update: { deliveryCharge: 60, isActive: true },
    create: { name: 'Chattogram City', deliveryCharge: 60, isActive: true },
  });

  await prisma.deliveryZone.upsert({
    where: { name: 'Outside Chattogram' },
    update: { deliveryCharge: 120, isActive: true },
    create: { name: 'Outside Chattogram', deliveryCharge: 120, isActive: true },
  });

  console.log('   - Seeding Chittagong City areas...');
  for (const area of chittagongCityAreas) {
    await prisma.deliveryArea.upsert({
      where: {
        name_district: {
          name: area,
          district: 'Chattogram',
        },
      },
      update: {
        zoneId: ctZone.id,
      },
      create: {
        name: area,
        district: 'Chattogram',
        zoneId: ctZone.id,
      },
    });
  }
  console.log(`   ✅ Seeded ${chittagongCityAreas.length} Chittagong City areas.`);

  // 4. Seed Mock Products
  console.log('🛍️ Seeding mock products...');
  const mockProducts = [
    // Educational Toys
    {
      title: 'Wooden Shape Sorter Block',
      slug: 'wooden-shape-sorter-block',
      description: 'A classic, durable wooden shape sorting block with colorful geometric shapes. Nurtures early cognitive skills and spatial awareness in toddlers.',
      price: 350.00,
      categoryId: categoriesMap['Educational Toys'],
      ageGroup: '1-3 Years',
      images: ['/images/products/shape-sorter.jpg'],
      stock: 15,
      benefits: 'Enhances motor skills, geometric color recognition, and hand-eye coordination.',
      featured: true,
    },
    {
      title: 'Coding Robot Toy',
      slug: 'coding-robot-toy',
      description: 'An interactive coding robot designed to teach young kids the basics of logic principles, sequence planning, and problem-solving.',
      price: 1200.00,
      categoryId: categoriesMap['Educational Toys'],
      ageGroup: '5-7 Years',
      images: ['/images/products/coding-robot.jpg'],
      stock: 8,
      benefits: 'Introduces basic programming logic, sequencing, and computational thinking.',
      featured: true,
    },
    {
      title: 'Wooden Abacus Puzzle',
      slug: 'wooden-abacus-puzzle',
      description: 'A premium wooden abacus featuring colorful rings to develop counting, basic addition, and color matching skills in early childhood.',
      price: 450.00,
      categoryId: categoriesMap['Educational Toys'],
      ageGroup: '3-5 Years',
      images: ['/images/products/abacus.jpg'],
      stock: 12,
      benefits: 'Teaches foundational arithmetic, fine motor skills, and color sorting.',
      featured: true,
    },
    // School Supplies
    {
      title: 'Ergonomic Kids Backpack',
      slug: 'ergonomic-kids-backpack',
      description: 'Lightweight ergonomic backpack featuring spinal support straps, waterproof layers, and multiple compartments for books and stationery.',
      price: 650.00,
      categoryId: categoriesMap['School Supplies'],
      ageGroup: '6-12 Years',
      images: ['/images/products/backpack.jpg'],
      stock: 20,
      benefits: 'Promotes good posture, supports heavy books comfortably, and is water-resistant.',
      featured: false,
    },
    {
      title: 'Premium Washable Markers Set',
      slug: 'premium-washable-markers-set',
      description: 'Vibrant markers that easily wash off skin, clothing, and walls. Child-safe, non-toxic, and long-lasting.',
      price: 250.00,
      categoryId: categoriesMap['School Supplies'],
      ageGroup: '3+ Years',
      images: ['/images/products/markers.jpg'],
      stock: 35,
      benefits: 'Non-toxic, extremely easy to wash, and encourages artistic expression.',
      featured: false,
    },
    {
      title: 'Ergonomic Writing Pencil Grip Trainer',
      slug: 'ergonomic-pencil-grip-trainer',
      description: 'Soft, non-toxic silicone grip guides that help children learn the correct pencil posture and improve writing control.',
      price: 150.00,
      categoryId: categoriesMap['School Supplies'],
      ageGroup: '3-6 Years',
      images: ['/images/products/pencil-grip.jpg'],
      stock: 50,
      benefits: 'Prevents hand fatigue, establishes proper tripod grasp, and fits standard pencils.',
      featured: false,
    },
    // Parenting Resources
    {
      title: 'Positive Parenting Guidebook',
      slug: 'positive-parenting-guidebook',
      description: 'An expert-written guide full of practical strategies on building emotional intelligence, positive communication, and connection with children.',
      price: 400.00,
      categoryId: categoriesMap['Parenting Resources'],
      ageGroup: 'Parents',
      images: ['/images/products/parenting-book.jpg'],
      stock: 12,
      benefits: 'Actionable tips for sibling harmony, emotional coaching, and positive boundary setting.',
      featured: true,
    },
    {
      title: 'Child Development Milestone Tracker Journal',
      slug: 'development-milestone-tracker',
      description: 'A beautifully laid out physical journal to track early speech, cognitive milestones, emotional triggers, and screen-free achievements.',
      price: 300.00,
      categoryId: categoriesMap['Parenting Resources'],
      ageGroup: 'Parents',
      images: ['/images/products/tracker-journal.jpg'],
      stock: 25,
      benefits: 'Provides guided daily prompts, milestones charts, and space for positive memory logging.',
      featured: true,
    },
    {
      title: 'Positive Coaching Activity Cards',
      slug: 'positive-coaching-cards',
      description: 'A deck of 50 prompt cards for parents to turn everyday routines like clean-up, bedtime, and meals into logic-building games and connection moments.',
      price: 200.00,
      categoryId: categoriesMap['Parenting Resources'],
      ageGroup: 'Parents',
      images: ['/images/products/activity-cards.jpg'],
      stock: 30,
      benefits: 'Promotes screen-free engagement, positive reinforcement phrases, and cooperation through play.',
      featured: false,
    },
  ];

  for (const prod of mockProducts) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        title: prod.title,
        description: prod.description,
        price: prod.price,
        categoryId: prod.categoryId,
        ageGroup: prod.ageGroup,
        images: prod.images,
        stock: prod.stock,
        benefits: prod.benefits,
        featured: prod.featured,
      },
      create: prod,
    });
    console.log(`   - Seeded product: ${prod.title}`);
  }

  console.log('🌿 Seeding finished successfully! Clean exit.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
