document.getElementById("generateBtn").addEventListener("click", () => {
  const input = document.getElementById("jsonInput").value;
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";

  let parsed;
  try {
    // parsed = JSON.parse(input.replace(/\n/g, ""));
    parsed = JSON.parse(input);
  } catch (e) {
    outputDiv.innerHTML = "<p style='color:red'>JSONの形式が正しくありません。</p>";
    return;
  }

  const { data } = parsed;
  const stringList = [];
  const numberList = [];

  // 1: HP, 2: SAN
  const hp = data.status?.find(s => s.label === "HP")?.value ?? 0;
  const san = data.status?.find(s => s.label === "SAN")?.value ?? 0;
  numberList.push(hp, san);

  // 3: アイデア, 4: 幸運, 5: 知識
  const cmdLines = data.commands.split("\n");
  let idea = 0, luck = 0, knowledge = 0;

  const regex = /^CCB<=(?<value>[0-9]+) ?【?(?<name>(?<=【).+(?=】)|.+)】?$/;

  for (const line of cmdLines) {
    const m = line.match(regex);
    if (m) {
      const value = parseInt(m.groups.value, 10);
      const name = m.groups.name;

      if (name.includes("アイデア")) {
        idea = value;
      } else if (name.includes("幸運")) {
        luck = value;
      } else if (name.includes("知識")) {
        knowledge = value;
      } else {
        stringList.push(name);
        numberList.push(value);
      }
    }
  }

  numberList.splice(2, 0, idea, luck, knowledge);

  // 文字列化
  const fullCommand = `data merge storage _ {_:[${JSON.stringify(stringList)},${JSON.stringify(numberList)}]}`;

  // 分割処理
  const commands = [];
  if (fullCommand.length <= 255) {
    commands.push(fullCommand);
  } else {
    let curStrings = [...stringList];
    let curNumbers = [...numberList];

    while (curStrings.length > 0 || curNumbers.length > 0) {
      let tempStrings = [...curStrings];
      let tempNumbers = [...curNumbers];
      let command = `data merge storage _ {_:[${JSON.stringify(tempStrings)},${JSON.stringify(tempNumbers)}]}`;

      while (command.length > 255 && (tempStrings.length > 0 || tempNumbers.length > 0)) {
        if (tempNumbers.length > tempStrings.length) {
          tempNumbers.pop();
        } else {
          tempStrings.pop();
        }
        command = `data merge storage _ {_:[${JSON.stringify(tempStrings)},${JSON.stringify(tempNumbers)}]}`;
      }

      commands.push(command);
      curStrings = curStrings.slice(tempStrings.length);
      curNumbers = curNumbers.slice(tempNumbers.length);
    }
  }

  // 出力表示
  commands.forEach((cmd, idx) => {
    const block = document.createElement("div");
    block.className = "output-block";

    const pre = document.createElement("pre");
    pre.textContent = cmd;

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "コピー";
    copyBtn.className = "copy-btn";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(cmd);
      copyBtn.textContent = "コピー済み";
      setTimeout(() => (copyBtn.textContent = "コピー"), 1500);
    };

    block.appendChild(pre);
    block.appendChild(copyBtn);
    outputDiv.appendChild(block);
  });
});
