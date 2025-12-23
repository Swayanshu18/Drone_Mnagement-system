/**
 * Database Seed Script
 * 
 * Seeds the database with demo users and data.
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function seedUsers() {
    console.log('🌱 Seeding users...');

    const users = [
        {
            email: 'admin@dronesurvey.com',
            name: 'Admin User',
            password: 'password123',
            role: 'admin'
        },
        {
            email: 'operator@dronesurvey.com',
            name: 'Operator User',
            password: 'password123',
            role: 'operator'
        },
        {
            email: 'viewer@dronesurvey.com',
            name: 'Viewer User',
            password: 'password123',
            role: 'viewer'
        }
    ];

    for (const user of users) {
        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [user.email]);

        if (existing.rows.length > 0) {
            console.log(`  ⏭️  User ${user.email} already exists, skipping...`);
            continue;
        }

        // Hash password
        const password_hash = await bcrypt.hash(user.password, 10);

        // Insert user
        await query(
            `INSERT INTO users (email, name, password_hash, role) 
             VALUES ($1, $2, $3, $4)`,
            [user.email, user.name, password_hash, user.role]
        );

        console.log(`  ✅ Created user: ${user.email} (${user.role})`);
    }
}

async function main() {
    try {
        await seedUsers();
        console.log('\n✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
