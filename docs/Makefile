SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
SPHINXPROJ    = fabric-es
SOURCEDIR     = source
BUILDDIR      = build

# Put help target first so it's the default.
.PHONY: help
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# Remove all generated documentation files.
.PHONY: clean
clean:
	-@rm -rf build/

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
.PHONY: Makefile
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
