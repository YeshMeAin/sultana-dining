# Categories
categories_data = [
  { name: "תבשילים", position: 1 },
  { name: "מאפים",   position: 2 },
  { name: "סלטים",   position: 3 },
  { name: "תוספות",  position: 4 }
]

categories = {}
categories_data.each do |attrs|
  categories[attrs[:name]] = Category.find_or_create_by!(name: attrs[:name]) do |c|
    c.position = attrs[:position]
  end
end

# Items
items_data = [
  { name: "תבשיל חצילים ועגבניות",
    description: "חצילים קלויים בתנור עם רוטב עגבניות ביתי, שום ועשבי תיבול.",
    price: 55, category: "תבשילים" },

  { name: "מוסקה ירקות",
    description: "שכבות של ירקות עונתיים עם בשמל קרמי ופרמזן.",
    price: 65, category: "תבשילים" },

  { name: "תבשיל שעועית לבנה",
    description: "שעועית לבנה בנוסח ביתי עם עגבניות, כוסברה ולימון כבוש.",
    price: 50, category: "תבשילים" },

  { name: "לחם שאור כפרי",
    description: "לחם שאור בתפיחה ארוכה, קרום פריך ופנים לח.",
    price: 38, category: "מאפים" },

  { name: "בורקס גבינה ותרד",
    description: "בורקס פריך במילוי גבינות ותרד טרי.",
    price: 15, category: "מאפים" },

  { name: "עוגת שזיפים עונתית",
    description: "עוגה רכה עם שזיפים טריים, קינמון וסוכר חום.",
    price: 45, category: "מאפים" },

  { name: "סלט עונתי עם עשבי תיבול",
    description: "ירקות עונתיים עם עשבי תיבול טריים מהגינה ורוטב לימון.",
    price: 35, category: "סלטים" },

  { name: "טאבולה קלאסי",
    description: "פטרוזיליה, בורגול, עגבניה ולימון — קל ורענן.",
    price: 30, category: "סלטים" },

  { name: "חומוס ביתי",
    description: "חומוס קרמי עם טחינה גולמית, שמן זית ופטרוזיליה.",
    price: 28, category: "תוספות" },

  { name: "מטבוחה",
    description: "רוטב עגבניות ופלפלים קלויים בסגנון מרוקאי.",
    price: 25, category: "תוספות" }
]

items_data.each do |attrs|
  Item.find_or_create_by!(name: attrs[:name]) do |item|
    item.description = attrs[:description]
    item.price = attrs[:price]
    item.category = categories[attrs[:category]]
    item.available = true
  end
end

puts "Seeded #{Category.count} categories and #{Item.count} items."
