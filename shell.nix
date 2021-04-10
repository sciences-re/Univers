with import <nixpkgs> { };

let
  create-react-app = nodePackages.create-react-app.override {
    preRebuild = ''
      substituteInPlace $(find -type f -name createReactApp.js) \
          --replace "path.join(root, 'yarn.lock')" "path.join(root, 'yarn.lock')); fs.chmodSync(path.join(root, 'yarn.lock'), 0o644"
    '';
  };
  mypython3 = python3.withPackages (ps: with ps; [ nltk pandas pdfminer beautifulsoup4 aiohttp]);
in
stdenv.mkDerivation {
  name = "node";
  buildInputs = [
    create-react-app
    nodejs
    yarn
    mypython3
    cacert
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}
