const test = require('node:test');
const assert = require('node:assert/strict');
const { presentSiteSetting, publicImageUrl } = require('../src/siteContent');

test('legacy localhost content images become same-origin paths', () => {
  assert.equal(publicImageUrl('http://localhost:5000/uploads/content/photo.jpg'), '/uploads/content/photo.jpg');
  assert.equal(publicImageUrl('https://127.0.0.1:5000/uploads/content/photo.webp'), '/uploads/content/photo.webp');
  assert.equal(publicImageUrl('https://res.cloudinary.com/demo/photo.jpg'), 'https://res.cloudinary.com/demo/photo.jpg');
});

test('about presenter repairs legacy leader and equipment image URLs', () => {
  const data = presentSiteSetting({
    leaderImage: 'http://localhost:5000/uploads/content/leader.jpg',
    equipment: [{ name: 'Máy thử', images: ['http://localhost:5000/uploads/content/machine.png'] }],
    orgUnits: []
  });
  assert.equal(data.leaderImage, '/uploads/content/leader.jpg');
  assert.deepEqual(data.equipment[0].images, ['/uploads/content/machine.png']);
});
