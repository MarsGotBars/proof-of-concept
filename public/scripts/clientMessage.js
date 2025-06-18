function setFormState(state) {
  const form = document.querySelector("#message-form");
  if (form) form.dataset.state = state;
}

let messageForm = document.querySelector("#message-form");
const emptyMessage = document.querySelector("#comment ul li.empty");
let testing = false;

function handleSubmit(e) {
  const form = e.target;
  setFormState("loading");

  const formData = new FormData(form);
  const formDataObject = new URLSearchParams(formData);
  e.preventDefault();
  (async () => {
    try {
      if (testing == true) {throw new Error("test");}
      const response = await fetch(form.action, {
        method: form.method,
        headers: { Accept: "text/html" },
        body: formDataObject,
      });

      if (!response.ok) throw new Error("Response not ok!");

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const performDOMUpdate = () => {
        const serverList = doc.querySelector("#comment ul");
        const localList = document.querySelector("#comment ul");

        if (serverList && localList) {
          const serverItems = Array.from(
            serverList.querySelectorAll("li[data-message-id]"),
          );
          for (let i = serverItems.length - 1; i >= 0; i--) {
            const li = serverItems[i];
            const id = li.dataset.messageId;
            if (!localList.querySelector(`li[data-message-id="${id}"]`)) {
              li.classList.add("card");
              li.style.setProperty("--vt-name", `msg-${id}`);
              localList.insertAdjacentHTML("afterbegin", li.outerHTML);
              if (emptyMessage) emptyMessage.remove();
            }
          }
        }

        const newForm = doc.querySelector("#message-form");
        if (newForm && newForm.outerHTML !== form.outerHTML) {
          form.replaceWith(newForm);
          messageForm = newForm;
          messageForm.addEventListener("submit", handleSubmit);
        }
      };

      if (document.startViewTransition) {
        document.startViewTransition(() => performDOMUpdate());
      } else {
        performDOMUpdate();
      }

      // Clear the form input after successful submission
      form.reset();

      setFormState("default");
    } catch (err) {
      console.error(err);
      setFormState("error");
      setTimeout(() => {
        setFormState("default");
      }, 5000);
    }
  })();
}

if (messageForm && "fetch" in window && "DOMParser" in window) {
  messageForm.addEventListener("submit", handleSubmit);
}
