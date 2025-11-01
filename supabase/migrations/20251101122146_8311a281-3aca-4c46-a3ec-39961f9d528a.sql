-- Insert fun achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES
('First Click!', 'You clicked once! What a legend!', '🎯', 'total_clicks', 1),
('Getting Started', '10 clicks! You''re on fire! 🔥', '🚀', 'total_clicks', 10),
('Click Addict', '100 clicks! Someone stop this person!', '🤪', 'total_clicks', 100),
('Clickzilla', '1000 clicks! Are you even real?', '🦖', 'total_clicks', 1000),
('The Devil''s Number', 'You hit 666! Spooky! 👹', '😈', 'special_number', 666),
('Lucky Number', 'You hit 777! Jackpot! 🎰', '🍀', 'special_number', 777),
('Nice Nice', 'You hit 6969! Nice! 😏', '😎', 'special_number', 6969),
('Ten Thousand!', 'You witnessed 10,000! Epic! 🎊', '🎆', 'special_number', 10000)
ON CONFLICT (id) DO NOTHING;