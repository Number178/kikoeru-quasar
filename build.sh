npx quasar build -m pwa
# npx quasar build -m spa

echo copy to dist folder in local machine
rm ../kikoeru-express/dist/* -r
cp ./dist/pwa/* ../kikoeru-express/dist -r
# cp ./dist/spa/* ../kikoeru-express/dist -r
echo copy finished
